import Link from "next/link";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { Card, CardBody, CardHeader, CardLink } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icons";
import { SimTag } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { ApplicationProgress, ApplicationStatusBadge } from "@/components/domain/Status";
import { TransactionRow } from "@/components/domain/Transaction";
import { NotificationList } from "@/components/domain/NotificationList";
import { AgentCard } from "@/components/domain/Cards";
import { BankLogo } from "@/components/domain/BankLogo";
import { operationalAgents, txView } from "@/lib/queries";

const actions: { href: string; label: string; icon: IconName; hint: string }[] = [
  { href: "/app/demandes/nouvelle", label: "Ouvrir un compte", icon: "file", hint: "Demande simulée" },
  { href: "/app/operations/depot", label: "Dépôt", icon: "arrowDown", hint: "Via un agent" },
  { href: "/app/operations/retrait", label: "Retrait", icon: "arrowUp", hint: "Via un agent" },
  { href: "/app/comparateur", label: "Comparer", icon: "compare", hint: "Offres bancaires" },
];

export default async function ClientHome() {
  const user = await requireClient();
  const db = readDb();
  const apps = db.applications.filter((a) => a.userId === user.id && !["completed", "rejected_sim"].includes(a.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const accounts = db.demoAccounts.filter((a) => a.userId === user.id);
  const txs = db.transactions.filter((t) => t.clientUserId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4).map((t) => txView(db, t));
  const notifs = db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
  const agents = operationalAgents(db);
  const nearby = [...agents.filter((a) => a.point?.commune === user.commune), ...agents.filter((a) => a.point?.commune !== user.commune)].slice(0, 2);
  const hour = Number(new Intl.DateTimeFormat("fr-FR", { hour: "numeric", timeZone: "Africa/Kinshasa" }).format(new Date()));

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-muted">{hour < 18 ? "Bonjour" : "Bonsoir"},</p>
        <h1 className="text-2xl font-bold">{user.firstName}</h1>
      </section>

      <nav aria-label="Raccourcis" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="rounded-[var(--radius-card)] border border-line bg-surface p-3.5 hover:border-cyan-700/50">
            <span className="grid size-9 place-items-center rounded-lg bg-cyan-50 text-cyan-700"><Icon name={a.icon} size={19} /></span>
            <span className="mt-2.5 block text-sm font-semibold">{a.label}</span>
            <span className="block text-xs text-muted">{a.hint}</span>
          </Link>
        ))}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader title="Mes demandes en cours" action={<CardLink href="/app/demandes">Tout voir</CardLink>} />
            {apps.length ? (
              <ul className="divide-y divide-line">
                {apps.slice(0, 3).map((a) => {
                  const bank = db.banks.find((b) => b.id === a.bankId)!;
                  const offer = db.offers.find((o) => o.id === a.offerId);
                  return (
                    <li key={a.id}>
                      <Link href={`/app/demandes/${a.id}`} className="block space-y-2.5 px-4 py-3.5 hover:bg-canvas sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{offer?.name ?? "Offre"} · {bank.name}</p>
                            <p className="font-mono text-xs text-muted">{a.reference}</p>
                          </div>
                          <ApplicationStatusBadge status={a.status} />
                        </div>
                        <ApplicationProgress status={a.status} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState icon="file" title="Aucune demande en cours" action={<ButtonLink href="/app/demandes/nouvelle" size="sm" icon="plus">Démarrer une demande</ButtonLink>}>
                Choisissez une banque de démonstration et lancez une demande d&apos;ouverture de compte.
              </EmptyState>
            )}
          </Card>

          <Card>
            <CardHeader title="Dernières activités" action={<CardLink href="/app/activites">Historique</CardLink>} />
            {txs.length ? (
              <ul className="mt-2 divide-y divide-line">{txs.map((t) => <TransactionRow key={t.id} tx={t} href={`/app/operations/${t.id}`} />)}</ul>
            ) : <EmptyState icon="activity" title="Aucune opération simulée">Vos dépôts et retraits simulés apparaîtront ici.</EmptyState>}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Mes comptes de démonstration" subtitle="Utilisables dans les simulations. Aucun solde réel n'est affiché." />
            <CardBody className="space-y-2">
              {accounts.length ? accounts.map((acc) => {
                const bank = db.banks.find((b) => b.id === acc.bankId)!;
                return (
                  <div key={acc.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <BankLogo name={bank.name} shortName={bank.shortName} color={bank.color} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{acc.label}</p>
                      <p className="font-mono text-xs text-muted">{acc.maskedNumber} · {acc.currency}</p>
                    </div>
                    <SimTag>Démo</SimTag>
                  </div>
                );
              }) : <p className="text-sm text-muted">Aucun compte de démonstration. Il en est créé un lorsqu&apos;une demande simulée est terminée.</p>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Agents à proximité" subtitle={user.commune ? `Autour de ${user.commune}` : "Réseau Flamob"} action={<CardLink href="/app/agents">Carte</CardLink>} />
            <CardBody className="space-y-2.5">
              {nearby.map((a) => <AgentCard key={a.agent.id} name={a.name} code={a.agent.code} point={a.point!} services={a.agent.authorizedServices} href={`/app/agents?point=${a.point!.id}`} />)}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Notifications" action={<CardLink href="/app/notifications">Tout voir</CardLink>} />
            <div className="mt-2"><NotificationList items={notifs} compact /></div>
          </Card>

          <Card>
            <CardHeader title="Bientôt sur Flamob" />
            <CardBody>
              <ul className="space-y-2 text-sm text-ink-soft">
                {["Dépôts et retraits réels via agents (sous réserve de partenariats et d'autorisations)", "Ouverture de compte transmise aux banques partenaires", "Vérification d'identité à distance"].map((t) => (
                  <li key={t} className="flex gap-2"><Icon name="clock" size={16} className="mt-0.5 shrink-0 text-muted" />{t}</li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
