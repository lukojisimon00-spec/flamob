import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, Pagination, Table, paginate } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { TreasuryTiles } from "@/components/domain/Treasury";
import { formatMoney } from "@/lib/money";
import { formatDateTime, sp } from "@/lib/format";
import { dayKey } from "@/lib/domain/time";
import type { Currency } from "@/lib/db/schema";

export const metadata = { title: "Trésorerie" };

const kindLabel = { deposit: "Dépôt", withdrawal: "Retrait", adjustment: "Ajustement" } as const;

export default async function Treasury({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const { agent } = await requireAgent();
  const db = readDb();
  const cur = (sp(q.devise) || "") as Currency | "";
  const balances = db.cashBalances.filter((b) => b.agentId === agent.id);
  const moves = db.cashMovements.filter((m) => m.agentId === agent.id && (!cur || m.currency === cur)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const today = dayKey(new Date());
  const todayMoves = db.cashMovements.filter((m) => m.agentId === agent.id && dayKey(m.createdAt) === today);
  const flows = (["USD", "CDF"] as Currency[]).map((c) => ({
    c, in: todayMoves.filter((m) => m.currency === c && m.cashDelta > 0).reduce((s, m) => s + m.cashDelta, 0),
    out: todayMoves.filter((m) => m.currency === c && m.cashDelta < 0).reduce((s, m) => s - m.cashDelta, 0),
  }));
  const { items, page, pageCount } = paginate(moves, Number(sp(q.page)) || 1, 20);
  const refOf = (id?: string) => db.transactions.find((t) => t.id === id)?.reference;
  return (
    <>
      <PageHeader title="Trésorerie simulée" subtitle="Modèle de gestion des espèces du point de service — ce n'est pas un portefeuille électronique." />
      <div className="space-y-5">
        <TreasuryTiles balances={balances} alert={db.settings.liquidityAlert} />
        <Alert tone="info" title="Règles de la simulation">
          Dépôt : espèces + (montant + frais), liquidité de compensation − montant. Retrait : espèces − montant, compensation + montant.
          Une opération est refusée si la trésorerie disponible est insuffisante. Les rééquilibrages sont réalisés par l&apos;administration.
        </Alert>
        <Card>
          <CardHeader title="Flux d'espèces du jour" />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {flows.map((f) => (
              <div key={f.c} className="rounded-xl bg-canvas p-3 text-sm">
                <p className="font-mono font-semibold">{f.c}</p>
                <p className="mt-1 flex justify-between"><span className="text-muted">Entrées</span><Mono>{f.in ? "+" : ""}{formatMoney(f.in, f.c)}</Mono></p>
                <p className="flex justify-between"><span className="text-muted">Sorties</span><Mono>{f.out ? "−" : ""}{formatMoney(f.out, f.c)}</Mono></p>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Journal des mouvements" subtitle="Chaque mouvement est tracé avec les soldes après opération." />
          <div className="px-4 pt-3 sm:px-5"><FilterBar><FilterSelect name="devise" label="Devise" defaultValue={cur} options={[{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }]} /></FilterBar></div>
          {items.length ? (
            <>
              <Table head={["Date", "Type", "Référence", "Espèces", "Compensation", "Espèces après", "Compensation après"]}>
                {items.map((m) => (
                  <tr key={m.id}>
                    <td className="whitespace-nowrap text-muted">{formatDateTime(m.createdAt)}</td>
                    <td>{kindLabel[m.kind]}{m.note && <span className="block text-xs text-muted">{m.note}</span>}</td>
                    <td><Mono>{refOf(m.transactionId) ?? "—"}</Mono></td>
                    <td className={m.cashDelta >= 0 ? "text-success" : "text-ink"}><Mono>{m.cashDelta >= 0 ? "+" : "−"}{formatMoney(Math.abs(m.cashDelta), m.currency)}</Mono></td>
                    <td><Mono>{m.floatDelta >= 0 ? "+" : "−"}{formatMoney(Math.abs(m.floatDelta), m.currency)}</Mono></td>
                    <td><Mono>{formatMoney(m.cashAfter, m.currency)}</Mono></td>
                    <td><Mono>{formatMoney(m.floatAfter, m.currency)}</Mono></td>
                  </tr>
                ))}
              </Table>
              <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/agent/tresorerie?${new URLSearchParams({ ...(cur && { devise: cur }), page: String(p) })}`} />
            </>
          ) : <EmptyState icon="wallet" title="Aucun mouvement" />}
        </Card>
      </div>
    </>
  );
}
