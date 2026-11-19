import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { Mono, PageHeader, Pagination, StatTile, Table, paginate } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, SimulationNotice } from "@/components/ui/feedback";
import { agentStats } from "@/lib/queries";
import { formatBp, formatMoney } from "@/lib/money";
import { formatDateTime, sp } from "@/lib/format";
import { operationLabel } from "@/lib/labels";
import { resolveCommissionRule } from "@/lib/domain/operations";
import type { Currency, OperationType } from "@/lib/db/schema";

export const metadata = { title: "Commissions" };

export default async function Commissions({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const { agent } = await requireAgent();
  const db = readDb();
  const s = agentStats(db, agent.id);
  const list = db.commissions.filter((c) => c.agentId === agent.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const byType = (["deposit", "withdrawal"] as OperationType[]).map((t) => ({ t, count: list.filter((c) => c.operationType === t).length, usd: list.filter((c) => c.operationType === t && c.currency === "USD").reduce((x, c) => x + c.amount, 0) }));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 15);
  const rules = (["deposit", "withdrawal"] as OperationType[]).flatMap((t) => (["USD", "CDF"] as Currency[]).map((c) => ({ t, c, r: resolveCommissionRule(db, agent.id, t, c) })));
  return (
    <>
      <PageHeader title="Commissions simulées" subtitle="Calculées automatiquement selon les règles configurées par l'administration." />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatTile label="Aujourd'hui (USD)" value={formatMoney(s.commissionsToday.USD, "USD")} icon="percent" />
          <StatTile label="Aujourd'hui (CDF)" value={formatMoney(s.commissionsToday.CDF, "CDF")} icon="percent" />
          <StatTile label="Ce mois (USD)" value={formatMoney(s.commissionsMonth.USD, "USD")} icon="clock" />
          <StatTile label="Ce mois (CDF)" value={formatMoney(s.commissionsMonth.CDF, "CDF")} icon="clock" />
        </div>
        <SimulationNotice>Commissions fictives : aucune rémunération réelle n&apos;est versée dans ce prototype.</SimulationNotice>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Par type de service" />
            <CardBody className="space-y-2">
              {byType.map((b) => <div key={b.t} className="flex justify-between rounded-lg bg-canvas px-3 py-2.5 text-sm"><span>{operationLabel[b.t]} · {b.count} op.</span><Mono>{formatMoney(b.usd, "USD")} (USD)</Mono></div>)}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Règles applicables" />
            <CardBody className="space-y-2 text-sm">
              {rules.map(({ t, c, r }) => (
                <div key={t + c} className="flex justify-between gap-2 rounded-lg bg-canvas px-3 py-2.5">
                  <span>{operationLabel[t]} {c}{r?.agentId && <span className="ml-1 text-xs text-cyan-700">(spécifique)</span>}</span>
                  <Mono>{r ? `${formatMoney(r.fixed, c)} + ${formatBp(r.percentBp)}${r.max !== null ? ` · max ${formatMoney(r.max, c)}` : ""}` : "Aucune"}</Mono>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
        <Card>
          <CardHeader title="Historique" />
          {items.length ? (
            <>
              <Table head={["Date", "Opération", "Référence", "Montant opéré", "Commission"]}>
                {items.map((c) => {
                  const tx = db.transactions.find((t) => t.id === c.transactionId);
                  return (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap text-muted">{formatDateTime(c.createdAt)}</td>
                      <td>{operationLabel[c.operationType]}</td>
                      <td><Mono>{tx?.reference}</Mono></td>
                      <td><Mono>{tx ? formatMoney(tx.amount, tx.currency) : "—"}</Mono></td>
                      <td className="font-semibold"><Mono>{formatMoney(c.amount, c.currency)}</Mono></td>
                    </tr>
                  );
                })}
              </Table>
              <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/agent/commissions?page=${p}`} />
            </>
          ) : <EmptyState icon="percent" title="Aucune commission" />}
        </Card>
      </div>
    </>
  );
}
