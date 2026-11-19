import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { DescriptionList, Mono, PageHeader, Table } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ConfirmAction } from "@/components/domain/AdminForms";
import { ApplicationStatusBadge } from "@/components/domain/Status";
import { setUserStatusAction } from "@/app/actions/admin";
import { adminLevelLabel, operationLabel, roleLabel, userStatusLabel, userStatusTone } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatPhone, fullName } from "@/lib/domain/users";
import { formatMoney } from "@/lib/money";

export default async function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("users.read");
  const db = readDb();
  const u = db.users.find((x) => x.id === id);
  if (!u) notFound();
  const agent = db.agents.find((a) => a.userId === u.id);
  const apps = db.applications.filter((a) => a.userId === u.id);
  const txs = db.transactions.filter((t) => t.clientUserId === u.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 10);
  const logs = db.auditLogs.filter((l) => l.actorUserId === u.id || l.entityId === u.id).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 15);
  const sessions = db.sessions.filter((s) => s.userId === u.id && new Date(s.expiresAt) > new Date()).length;
  const canManage = can(actor, "users.manage") && actor.id !== u.id && (u.role !== "admin" || actor.adminLevel === "superadmin");
  return (
    <>
      <PageHeader back={{ href: "/admin/utilisateurs", label: "Utilisateurs" }} title={fullName(u)} subtitle={roleLabel[u.role] + (u.adminLevel ? ` · ${adminLevelLabel[u.adminLevel]}` : "")}
        action={<Badge tone={userStatusTone[u.status]}>{userStatusLabel[u.status]}</Badge>} />
      <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card>
            <CardHeader title="Profil" />
            <CardBody>
              <DescriptionList items={[
                { label: "Téléphone", value: <Mono>{formatPhone(u.phone)}</Mono> },
                { label: "E-mail", value: u.email ?? "—" },
                { label: "Commune", value: u.commune ?? "—" },
                { label: "Vérification (simulée)", value: u.phoneVerifiedSimulated ? "Oui" : "Non" },
                { label: "Inscription", value: formatDate(u.createdAt) },
                { label: "Dernière connexion", value: u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "—" },
                { label: "Sessions actives", value: sessions },
                ...(agent ? [{ label: "Fiche agent", value: <Link className="font-semibold text-cyan-700 hover:underline" href={`/admin/agents/${agent.id}`}>{agent.code}</Link> }] : []),
              ]} />
            </CardBody>
          </Card>
          {canManage && (
            <Card>
              <CardHeader title="Gestion des accès" subtitle="La suspension ferme immédiatement toutes les sessions." />
              <CardBody>
                {u.status === "active" ? (
                  <ConfirmAction action={setUserStatusAction} id="suspend" hidden={{ userId: u.id, status: "suspended" }} trigger="Suspendre le compte" tone="danger"
                    title={`Suspendre ${fullName(u)} ?`} description="L'utilisateur ne pourra plus se connecter jusqu'à réactivation." confirmLabel="Suspendre" reasonName="reason" />
                ) : (
                  <ConfirmAction action={setUserStatusAction} id="reactivate" hidden={{ userId: u.id, status: "active" }} trigger="Réactiver le compte"
                    title={`Réactiver ${fullName(u)} ?`} confirmLabel="Réactiver" reasonName="reason" reasonLabel="Commentaire (facultatif)" />
                )}
              </CardBody>
            </Card>
          )}
        </div>
        <div className="space-y-5">
          {u.role === "client" && (
            <>
              <Card>
                <CardHeader title={`Demandes (${apps.length})`} />
                {apps.length ? (
                  <ul className="mt-2 divide-y divide-line">{apps.map((a) => (
                    <li key={a.id}><Link href={`/admin/demandes/${a.id}`} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm hover:bg-canvas sm:px-5"><Mono>{a.reference}</Mono><ApplicationStatusBadge status={a.status} /></Link></li>
                  ))}</ul>
                ) : <CardBody><p className="text-sm text-muted">Aucune demande.</p></CardBody>}
              </Card>
              <Card className="overflow-hidden">
                <CardHeader title="Opérations récentes" />
                {txs.length ? (
                  <Table head={["Date", "Type", "Référence", "Montant"]}>
                    {txs.map((t) => <tr key={t.id}><td className="text-muted">{formatDateTime(t.createdAt)}</td><td>{operationLabel[t.type]}</td><td><Link href={`/admin/operations/${t.id}`} className="text-cyan-700 hover:underline"><Mono>{t.reference}</Mono></Link></td><td><Mono>{formatMoney(t.amount, t.currency)}</Mono></td></tr>)}
                  </Table>
                ) : <CardBody><p className="text-sm text-muted">Aucune opération.</p></CardBody>}
              </Card>
            </>
          )}
          <Card>
            <CardHeader title="Activités" />
            {logs.length ? (
              <ul className="mt-2 divide-y divide-line">{logs.map((l) => (
                <li key={l.id} className="px-4 py-2.5 text-sm sm:px-5"><Mono className="text-cyan-700">{l.action}</Mono><span className="block text-xs text-muted">{formatDateTime(l.at)}{l.details ? ` · ${l.details}` : ""}</span></li>
              ))}</ul>
            ) : <EmptyState icon="journal" title="Aucune activité" />}
          </Card>
        </div>
      </div>
    </>
  );
}
