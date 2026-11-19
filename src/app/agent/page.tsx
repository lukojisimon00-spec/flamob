import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { Card, CardBody, CardHeader, CardLink } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/data";
import { ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { BarChart } from "@/components/ui/BarChart";
import { TreasuryTiles } from "@/components/domain/Treasury";
import { TransactionRow } from "@/components/domain/Transaction";
import { NotificationList } from "@/components/domain/NotificationList";
import { agentStats, dailySeries, txView } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { agentStatusLabel, agentStatusTone, pointStatusLabel, pointStatusTone } from "@/lib/labels";

export const metadata = { title: "Espace agent" };

export default async function AgentHome() {
  const { user, agent } = await requireAgent();
  const db = readDb();
  const point = db.servicePoints.find((p) => p.id === agent.servicePointId);
  const s = agentStats(db, agent.id);
  const balances = db.cashBalances.filter((b) => b.agentId === agent.id);
  const recent = db.transactions.filter((t) => t.agentId === agent.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5).map((t) => txView(db, t));
  const notifs = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const series = dailySeries(db, 14, (t) => t.agentId === agent.id).map((d) => ({ key: d.day, label: d.day.slice(8, 10) + "/" + d.day.slice(5, 7), value: d.count }));
  const canOperate = agent.status === "active" && point?.status === "open";
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Bonjour,</p>
          <h1 className="text-2xl font-bold">{user.firstName} {user.lastName}</h1>
          <p className="mt-1 text-sm text-muted"><span className="font-mono">{agent.code}</span> · {point?.name ?? "Aucun point de service"}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={agentStatusTone[agent.status]}>Agent {agentStatusLabel[agent.status].toLowerCase()}</Badge>
          {point && <Badge tone={pointStatusTone[point.status]}>Point {pointStatusLabel[point.status].toLowerCase()}</Badge>}
        </div>
      </section>
      {!canOperate && <Alert tone="warning" title="Opérations indisponibles">Votre statut ou celui de votre point de service ne permet pas de réaliser des opérations simulées.</Alert>}
      <div className="grid grid-cols-2 gap-2.5">
        <ButtonLink href="/agent/operations/nouvelle?type=deposit" size="lg" icon="arrowDown" variant={canOperate ? "primary" : "secondary"}>Dépôt</ButtonLink>
        <ButtonLink href="/agent/operations/nouvelle?type=withdrawal" size="lg" icon="arrowUp" variant={canOperate ? "primary" : "secondary"}>Retrait</ButtonLink>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold">Trésorerie simulée</h2><CardLink href="/agent/tresorerie">Détails</CardLink></div>
        <TreasuryTiles balances={balances} alert={db.settings.liquidityAlert} />
      </section>

      <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <StatTile label="Opérations du jour" value={s.todayCount} icon="activity" />
        <StatTile label="Dépôts du jour" value={s.todayDepositCount} hint={`${formatMoney(s.todayDeposits.USD, "USD")} · ${formatMoney(s.todayDeposits.CDF, "CDF")}`} icon="arrowDown" />
        <StatTile label="Retraits du jour" value={s.todayWithdrawalCount} hint={`${formatMoney(s.todayWithdrawals.USD, "USD")} · ${formatMoney(s.todayWithdrawals.CDF, "CDF")}`} icon="arrowUp" />
        <StatTile label="Commissions du jour" value={formatMoney(s.commissionsToday.USD, "USD")} hint={formatMoney(s.commissionsToday.CDF, "CDF")} icon="percent" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Activité — 14 derniers jours" subtitle="Nombre d'opérations simulées par jour" />
          <CardBody><BarChart data={series} label="Opérations simulées par jour" /></CardBody>
        </Card>
        <Card>
          <CardHeader title="Dernières opérations" action={<CardLink href="/agent/operations">Historique</CardLink>} />
          {recent.length ? <ul className="mt-2 divide-y divide-line">{recent.map((t) => <TransactionRow key={t.id} tx={t} href={`/agent/operations/${t.id}`} perspective="agent" />)}</ul>
            : <EmptyState icon="list" title="Aucune opération" />}
        </Card>
      </div>
      <Card>
        <CardHeader title="Notifications" action={<CardLink href="/agent/notifications">Tout voir</CardLink>} />
        <div className="mt-2"><NotificationList items={notifs} compact /></div>
      </Card>
    </div>
  );
}
