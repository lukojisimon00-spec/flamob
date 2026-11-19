import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { Mono, PageHeader, StatTile, Table } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimulationNotice } from "@/components/ui/feedback";
import { CommissionRuleForm } from "@/components/domain/ConfigForms";
import { saveCommissionRuleAction } from "@/app/actions/admin";
import { formatBp, formatMoney } from "@/lib/money";
import { formatDateTime, sp } from "@/lib/format";
import { operationLabel } from "@/lib/labels";
import { monthKey } from "@/lib/domain/time";
import { agentView } from "@/lib/queries";

export const metadata = { title: "Commissions" };

export default async function CommissionsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const actor = await requirePermission("commissions.read");
  const manage = can(actor, "commissions.manage");
  const db = readDb();
  const month = monthKey(new Date());
  const sum = (pred: (c: (typeof db.commissions)[number]) => boolean, cur: "USD" | "CDF") => db.commissions.filter((c) => c.currency === cur && pred(c)).reduce((s, c) => s + c.amount, 0);
  const agents = db.agents.map((a) => ({ id: a.id, label: `${a.code} — ${agentView(db, a.id)!.name}` }));
  const editing = db.commissionRules.find((r) => r.id === sp(q.regle));
  const byAgent = db.agents.map((a) => ({ a, usd: sum((c) => c.agentId === a.id && monthKey(c.createdAt) === month, "USD"), cdf: sum((c) => c.agentId === a.id && monthKey(c.createdAt) === month, "CDF") })).sort((x, y) => y.usd - x.usd);
  return (
    <>
      <PageHeader title="Commissions simulées" subtitle="Règles de calcul et suivi des commissions des agents." />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatTile label="Ce mois (USD)" value={formatMoney(sum((c) => monthKey(c.createdAt) === month, "USD"), "USD")} icon="percent" />
          <StatTile label="Ce mois (CDF)" value={formatMoney(sum((c) => monthKey(c.createdAt) === month, "CDF"), "CDF")} icon="percent" />
          <StatTile label="Total (USD)" value={formatMoney(sum(() => true, "USD"), "USD")} icon="coinsStack" />
          <StatTile label="Total (CDF)" value={formatMoney(sum(() => true, "CDF"), "CDF")} icon="coinsStack" />
        </div>
        <SimulationNotice>Aucune commission réelle n&apos;est versée. Une modification de règle s&apos;applique aux opérations suivantes uniquement (pas de recalcul rétroactif).</SimulationNotice>
        <Card className="overflow-hidden">
          <CardHeader title="Règles" subtitle="Commission = part fixe + part variable, bornée par min/max. Une règle « agent » est prioritaire sur la règle générale." />
          <Table head={["Opération", "Devise", "Cible", "Fixe", "Variable", "Min", "Max", "Statut", ""]}>
            {db.commissionRules.map((r) => (
              <tr key={r.id}>
                <td>{operationLabel[r.operationType]}</td><td><Mono>{r.currency}</Mono></td>
                <td>{r.agentId ? <Mono>{db.agents.find((a) => a.id === r.agentId)?.code}</Mono> : "Tous"}</td>
                <td><Mono>{formatMoney(r.fixed, r.currency)}</Mono></td><td><Mono>{formatBp(r.percentBp)}</Mono></td>
                <td><Mono>{formatMoney(r.min, r.currency)}</Mono></td><td><Mono>{r.max === null ? "—" : formatMoney(r.max, r.currency)}</Mono></td>
                <td><Badge tone={r.active ? "success" : "neutral"}>{r.active ? "Active" : "Inactive"}</Badge></td>
                <td>{manage && <Link href={`/admin/commissions?regle=${r.id}#regle`} className="font-semibold text-cyan-700 hover:underline">Modifier</Link>}</td>
              </tr>
            ))}
          </Table>
        </Card>
        {manage && (
          <Card><div id="regle" /><CardHeader title={editing ? "Modifier la règle" : "Nouvelle règle"} action={editing ? <Link href="/admin/commissions" className="text-sm font-semibold text-cyan-700">Annuler</Link> : undefined} />
            <CardBody><CommissionRuleForm key={editing?.id ?? "new"} action={saveCommissionRuleAction} rule={editing} agents={agents} /></CardBody></Card>
        )}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader title="Par agent — mois en cours" />
            <Table head={["Agent", "USD", "CDF"]}>
              {byAgent.map(({ a, usd, cdf }) => <tr key={a.id}><td><Link href={`/admin/agents/${a.id}`} className="text-cyan-700 hover:underline"><Mono>{a.code}</Mono></Link></td><td><Mono>{formatMoney(usd, "USD")}</Mono></td><td><Mono>{formatMoney(cdf, "CDF")}</Mono></td></tr>)}
            </Table>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader title="Historique récent" />
            <Table head={["Date", "Agent", "Opération", "Commission"]}>
              {[...db.commissions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12).map((c) => (
                <tr key={c.id}><td className="text-muted">{formatDateTime(c.createdAt)}</td><td><Mono>{db.agents.find((a) => a.id === c.agentId)?.code}</Mono></td><td>{operationLabel[c.operationType]}</td><td><Mono>{formatMoney(c.amount, c.currency)}</Mono></td></tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  );
}
