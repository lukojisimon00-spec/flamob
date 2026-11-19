import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { Card, CardBody, CardHeader, CardLink } from "@/components/ui/card";
import { PageHeader, StatTile } from "@/components/ui/data";
import { Badge, SimTag } from "@/components/ui/badge";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { BarChart } from "@/components/ui/BarChart";
import { Icon } from "@/components/ui/icons";
import { dailySeries } from "@/lib/queries";
import { formatMoney } from "@/lib/money";
import { formatDateTime, relativeTime, sp } from "@/lib/format";
import { incidentPriorityLabel, incidentPriorityTone } from "@/lib/labels";
import { fullName } from "@/lib/domain/users";
import type { Currency } from "@/lib/db/schema";

export const metadata = { title: "Administration" };

const PERIODS = { "7": 7, "30": 30, "90": 90 } as const;

export default async function AdminHome({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("dashboard.read");
  const db = readDb();
  const days = PERIODS[(sp(q.periode) || "30") as keyof typeof PERIODS] ?? 30;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const txs = db.transactions.filter((t) => t.status === "completed" && t.createdAt >= since);
  const vol = (c: Currency, type?: string) => txs.filter((t) => t.currency === c && (!type || t.type === type)).reduce((s, t) => s + t.amount, 0);
  const coms = (c: Currency) => db.commissions.filter((x) => x.currency === c && x.createdAt >= since).reduce((s, x) => s + x.amount, 0);
  const clients = db.users.filter((u) => u.role === "client");
  const pendingApps = db.applications.filter((a) => ["submitted", "under_review"].includes(a.status));
  const openIncidents = db.incidents.filter((i) => i.status === "open" || i.status === "in_progress");
  const low = db.cashBalances.filter((b) => {
    const a = db.agents.find((x) => x.id === b.agentId);
    return a?.status === "active" && (b.cash < db.settings.liquidityAlert[b.currency] || b.float < db.settings.liquidityAlert[b.currency]);
  });
  const series = dailySeries(db, days, () => true).map((d) => ({ key: d.day, label: `${d.day.slice(8)}/${d.day.slice(5, 7)}`, value: d.count }));
  const recent = [...db.auditLogs].sort((a, b) => b.at.localeCompare(a.at)).filter((l) => !l.action.startsWith("auth.")).slice(0, 8);
  const nameOf = (id?: string) => { const u = db.users.find((x) => x.id === id); return u ? fullName(u) : "Système"; };

  return (
    <>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme — données de démonstration calculées à partir de l'application."
        action={
          <nav className="flex gap-1 rounded-[var(--radius-control)] bg-navy-50 p-1" aria-label="Période">
            {Object.keys(PERIODS).map((k) => (
              <Link key={k} href={`/admin?periode=${k}`} aria-current={days === Number(k) ? "page" : undefined}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${days === Number(k) ? "bg-surface font-semibold text-navy shadow-[var(--shadow-card)]" : "text-muted"}`}>{k} j</Link>
            ))}
          </nav>
        } />
      {q.refus && <div className="mb-4"><Alert tone="warning">Vous n&apos;avez pas la permission d&apos;accéder à cette page.</Alert></div>}
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          <StatTile label="Clients" value={clients.length} hint={`${clients.filter((u) => u.status === "suspended").length} suspendu(s)`} icon="users" />
          <StatTile label="Agents" value={db.agents.length} hint={`${db.agents.filter((a) => a.status === "active").length} actifs`} icon="user" />
          <StatTile label="Points de service" value={db.servicePoints.length} hint={`${db.servicePoints.filter((p) => p.status === "open").length} ouverts`} icon="store" />
          <StatTile label="Demandes simulées" value={db.applications.filter((a) => a.status !== "draft").length} hint={`${pendingApps.length} à traiter`} icon="file" />
          <StatTile label={`Opérations (${days} j)`} value={txs.length} hint={`${txs.filter((t) => t.type === "deposit").length} dépôts · ${txs.filter((t) => t.type === "withdrawal").length} retraits`} icon="receipt" />
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label={`Volume simulé USD (${days} j)`} value={formatMoney(vol("USD"), "USD")} hint={`Dépôts ${formatMoney(vol("USD", "deposit"), "USD")} · Retraits ${formatMoney(vol("USD", "withdrawal"), "USD")}`} tag={<SimTag />} />
          <StatTile label={`Volume simulé CDF (${days} j)`} value={formatMoney(vol("CDF"), "CDF")} hint={`Dépôts ${formatMoney(vol("CDF", "deposit"), "CDF")}`} tag={<SimTag />} />
          <StatTile label={`Commissions simulées (${days} j)`} value={formatMoney(coms("USD"), "USD")} hint={formatMoney(coms("CDF"), "CDF")} tag={<SimTag />} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader title="Opérations simulées par jour" subtitle={`${days} derniers jours`} />
            <CardBody><BarChart data={series} label="Opérations simulées par jour" /></CardBody>
          </Card>
          <Card>
            <CardHeader title="Alertes" />
            <CardBody className="space-y-2">
              {low.map((b) => {
                const a = db.agents.find((x) => x.id === b.agentId)!;
                return (
                  <Link key={b.agentId + b.currency} href={`/admin/agents/${a.id}`} className="flex items-center gap-3 rounded-lg bg-danger-bg px-3 py-2.5 text-sm hover:opacity-90">
                    <Icon name="alert" size={18} className="text-danger" />
                    <span className="flex-1">Liquidité basse — <span className="font-mono">{a.code}</span> ({b.currency})</span>
                    <Icon name="chevronRight" size={16} className="text-muted" />
                  </Link>
                );
              })}
              {pendingApps.length > 0 && (
                <Link href="/admin/demandes?statut=submitted" className="flex items-center gap-3 rounded-lg bg-info-bg px-3 py-2.5 text-sm"><Icon name="file" size={18} className="text-info" /><span className="flex-1">{pendingApps.length} demande(s) en attente de traitement</span><Icon name="chevronRight" size={16} className="text-muted" /></Link>
              )}
              {openIncidents.filter((i) => i.priority === "high").map((i) => (
                <Link key={i.id} href={`/admin/incidents/${i.id}`} className="flex items-center gap-3 rounded-lg bg-warning-bg px-3 py-2.5 text-sm"><Icon name="megaphone" size={18} className="text-warning" /><span className="flex-1">Incident prioritaire : {i.title}</span></Link>
              ))}
              {!low.length && !pendingApps.length && !openIncidents.some((i) => i.priority === "high") && <p className="text-sm text-muted">Aucune alerte.</p>}
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Incidents ouverts" action={<CardLink href="/admin/incidents">Tout voir</CardLink>} />
            {openIncidents.length ? (
              <ul className="mt-2 divide-y divide-line">
                {openIncidents.slice(0, 5).map((i) => (
                  <li key={i.id}><Link href={`/admin/incidents/${i.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-canvas sm:px-5">
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{i.title}</span><span className="font-mono text-xs text-muted">{i.reference} · {relativeTime(i.createdAt)}</span></span>
                    <Badge tone={incidentPriorityTone[i.priority]}>{incidentPriorityLabel[i.priority]}</Badge>
                  </Link></li>
                ))}
              </ul>
            ) : <EmptyState icon="check" title="Aucun incident ouvert" />}
          </Card>
          <Card>
            <CardHeader title="Activité récente" action={<CardLink href="/admin/journal">Journal</CardLink>} />
            <ul className="mt-2 divide-y divide-line">
              {recent.map((l) => (
                <li key={l.id} className="px-4 py-2.5 text-sm sm:px-5">
                  <p><span className="font-semibold">{nameOf(l.actorUserId)}</span> · <span className="font-mono text-xs text-cyan-700">{l.action}</span></p>
                  <p className="text-xs text-muted">{formatDateTime(l.at)}{l.details ? ` · ${l.details}` : ""}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
