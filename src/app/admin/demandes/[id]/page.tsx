import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { DescriptionList, Mono, PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SimulationNotice } from "@/components/ui/feedback";
import { ApplicationStatusBadge, ApplicationTimeline } from "@/components/domain/Status";
import { DecisionForm } from "@/components/domain/DecisionForm";
import { decideApplicationAction } from "@/app/actions/admin";
import { ADMIN_TRANSITIONS } from "@/lib/domain/applications";
import { accountTypeLabel } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export default async function AppAdminDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("applications.read");
  const db = readDb();
  const app = db.applications.find((a) => a.id === id && a.status !== "draft");
  if (!app) notFound();
  const bank = db.banks.find((b) => b.id === app.bankId);
  const offer = db.offers.find((o) => o.id === app.offerId);
  const names: Record<string, string> = {};
  for (const e of app.history) if (e.byUserId) { const u = db.users.find((x) => x.id === e.byUserId); if (u) names[e.byUserId] = fullName(u); }
  const allowed = ADMIN_TRANSITIONS[app.status] ?? [];
  const a = app.applicant;
  return (
    <>
      <PageHeader back={{ href: "/admin/demandes", label: "Demandes" }} title={`${a.firstName} ${a.lastName}`} subtitle={<Mono>{app.reference}</Mono>} action={<ApplicationStatusBadge status={app.status} />} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {can(actor, "applications.decide") && allowed.length > 0 && (
            <Card><CardHeader title="Traitement (simulation)" /><CardBody className="space-y-3"><DecisionForm action={decideApplicationAction} id={app.id} allowed={allowed} /><SimulationNotice>Les décisions ne déclenchent aucune ouverture de compte réelle ; le client est notifié.</SimulationNotice></CardBody></Card>
          )}
          <Card>
            <CardHeader title="Dossier" />
            <CardBody>
              <DescriptionList cols={2} items={[
                { label: "Banque", value: bank?.name },
                { label: "Offre", value: `${offer?.name} (${offer ? accountTypeLabel[offer.accountType] : ""})` },
                { label: "Devise", value: app.currency },
                { label: "Soumise le", value: app.submittedAt ? formatDateTime(app.submittedAt) : "—" },
                { label: "Date de naissance", value: formatDate(a.birthDate) },
                { label: "Profession", value: a.occupation },
                { label: "Pièce", value: `${a.idType} · ${a.idNumber}` },
                { label: "Adresse", value: `${a.address}, ${a.commune}` },
                { label: "Téléphone", value: <Mono>{a.phone}</Mono> },
                { label: "E-mail", value: a.email ?? "—" },
                { label: "Compte client", value: <Link className="font-semibold text-cyan-700 hover:underline" href={`/admin/utilisateurs/${app.userId}`}>Voir</Link> },
                { label: "Documents (métadonnées)", value: app.documents.length ? app.documents.map((d) => `${d.kind} : ${d.name}`).join(" · ") : "Aucun" },
              ]} />
            </CardBody>
          </Card>
        </div>
        <Card><CardHeader title="Historique et commentaires" /><CardBody><ApplicationTimeline app={app} names={names} /></CardBody></Card>
      </div>
    </>
  );
}
