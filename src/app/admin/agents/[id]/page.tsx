import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { DescriptionList, Mono, PageHeader, StatTile, Table } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/feedback";
import { TreasuryTiles } from "@/components/domain/Treasury";
import { AgentEditForm, TreasuryAdjustForm } from "@/components/domain/AgentAdminForms";
import { adjustTreasuryAction, updateAgentAction } from "@/app/actions/admin";
import { agentStats, agentView } from "@/lib/queries";
import { agentStatusLabel, agentStatusTone, operationLabel, serviceLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatPhone } from "@/lib/domain/users";

export default async function AgentAdminDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const actor = await requirePermission("agents.read");
  const db = readDb();
  const v = agentView(db, id);
  if (!v) notFound();
  const s = agentStats(db, id);
  const txs = db.transactions.filter((t) => t.agentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const points = db.servicePoints.map((p) => ({ id: p.id, name: `${p.name} (${p.commune})` }));
  return (
    <>
      <PageHeader back={{ href: "/admin/agents", label: "Agents" }} title={v.name} subtitle={<Mono>{v.agent.code}</Mono>} action={<Badge tone={agentStatusTone[v.agent.status]}>{agentStatusLabel[v.agent.status]}</Badge>} />
      {q.cree && <div className="mb-4"><Alert tone="success" title="Agent créé">Attribuez des services et une dotation de trésorerie simulée pour qu&apos;il puisse opérer.</Alert></div>}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <StatTile label="Opérations (total)" value={s.totalCount} icon="activity" />
          <StatTile label="Opérations du jour" value={s.todayCount} icon="clock" />
          <StatTile label="Commissions du mois" value={formatMoney(s.commissionsMonth.USD, "USD")} hint={formatMoney(s.commissionsMonth.CDF, "CDF")} icon="percent" />
          <StatTile label="Commissions totales" value={formatMoney(s.commissionsTotal.USD, "USD")} hint={formatMoney(s.commissionsTotal.CDF, "CDF")} icon="percent" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Informations" />
            <CardBody>
              <DescriptionList items={[
                { label: "Téléphone", value: <Mono>{formatPhone(v.user.phone)}</Mono> },
                { label: "Compte utilisateur", value: <Link href={`/admin/utilisateurs/${v.user.id}`} className="font-semibold text-cyan-700 hover:underline">Voir le compte</Link> },
                { label: "Point de service", value: v.point ? <Link href={`/admin/points/${v.point.id}`} className="font-semibold text-cyan-700 hover:underline">{v.point.name}</Link> : "Non attribué" },
                { label: "Services", value: v.agent.authorizedServices.map((x) => serviceLabel[x]).join(", ") || "Aucun" },
                { label: "Créé le", value: formatDate(v.agent.createdAt) },
              ]} />
            </CardBody>
          </Card>
          {can(actor, "agents.manage") && (
            <Card><CardHeader title="Statut, point et services" /><CardBody>
              <AgentEditForm action={updateAgentAction} agentId={id} status={v.agent.status} servicePointId={v.agent.servicePointId} services={v.agent.authorizedServices} points={points} />
            </CardBody></Card>
          )}
        </div>
        <section className="space-y-3">
          <h2 className="font-semibold">Trésorerie simulée</h2>
          <TreasuryTiles balances={db.cashBalances.filter((b) => b.agentId === id)} alert={db.settings.liquidityAlert} />
          {can(actor, "treasury.adjust") && <Card><CardHeader title="Rééquilibrage simulé" subtitle="Tracé dans le journal de trésorerie et le journal d'activité." /><CardBody><TreasuryAdjustForm action={adjustTreasuryAction} agentId={id} /></CardBody></Card>}
        </section>
        <Card className="overflow-hidden">
          <CardHeader title="Dernières opérations" action={<Link href={`/admin/operations?agent=${id}`} className="text-sm font-semibold text-cyan-700 hover:underline">Toutes</Link>} />
          <Table head={["Date", "Type", "Référence", "Client", "Montant", "Commission"]}>
            {txs.map((t) => (
              <tr key={t.id}><td className="text-muted">{formatDateTime(t.createdAt)}</td><td>{operationLabel[t.type]}</td><td><Link href={`/admin/operations/${t.id}`} className="text-cyan-700 hover:underline"><Mono>{t.reference}</Mono></Link></td><td>{t.clientName}</td><td><Mono>{formatMoney(t.amount, t.currency)}</Mono></td><td><Mono>{formatMoney(t.commission, t.currency)}</Mono></td></tr>
            ))}
          </Table>
        </Card>
      </div>
    </>
  );
}
