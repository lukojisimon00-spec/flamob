import { notFound, redirect } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { DescriptionList, Mono, PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, SimulationNotice } from "@/components/ui/feedback";
import { ApplicationProgress, ApplicationStatusBadge, ApplicationTimeline } from "@/components/domain/Status";
import { DeleteDraftForm, RespondInfoForm } from "@/components/domain/ClientForms";
import { deleteDraftAction, respondInfoAction } from "@/app/actions/client";
import { accountTypeLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/domain/users";
import { Icon } from "@/components/ui/icons";

export default async function ApplicationDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const user = await requireClient();
  const db = readDb();
  const app = db.applications.find((a) => a.id === id && a.userId === user.id);
  if (!app) notFound();
  if (app.status === "draft" && !q.brouillon) redirect(`/app/demandes/nouvelle?brouillon=${app.id}`);
  const bank = db.banks.find((b) => b.id === app.bankId)!;
  const offer = db.offers.find((o) => o.id === app.offerId);
  const names: Record<string, string> = {};
  for (const e of app.history) if (e.byUserId) {
    const u = db.users.find((x) => x.id === e.byUserId);
    if (u) names[e.byUserId] = u.id === user.id ? "Vous" : u.role === "admin" ? "Équipe Flamob" : fullName(u);
  }
  const lastInfo = [...app.history].reverse().find((e) => e.status === "info_required");
  const account = db.demoAccounts.find((a) => a.applicationId === app.id);
  return (
    <>
      <PageHeader back={{ href: "/app/demandes", label: "Mes demandes" }} title={offer?.name ?? "Demande"} subtitle={<Mono>{app.reference}</Mono>} action={<ApplicationStatusBadge status={app.status} />} />
      <div className="space-y-5">
        {q.soumise && <Alert tone="success" title="Demande soumise (simulation)">Votre référence : <span className="font-mono">{app.reference}</span>. Vous serez notifié à chaque changement de statut.</Alert>}
        {q.brouillon && <Alert tone="success">Brouillon enregistré.</Alert>}
        {app.status === "approved_sim" && <Alert tone="success" title="Approuvée dans le cadre de la simulation">Ceci n&apos;est pas une ouverture de compte réelle.</Alert>}
        {app.status === "rejected_sim" && <Alert tone="danger" title="Refusée dans le cadre de la simulation">{app.history.at(-1)?.comment}</Alert>}
        {account && <Alert tone="info" title="Compte de démonstration créé">{account.label} <span className="font-mono">{account.maskedNumber}</span> — utilisable uniquement dans les simulations.</Alert>}

        <Card><CardBody className="space-y-2"><ApplicationProgress status={app.status} /><div className="flex justify-between text-xs text-muted"><span>Soumise</span><span>Examen</span><span>Décision</span><span>Terminée</span></div></CardBody></Card>

        {app.status === "info_required" && (
          <Card className="border-warning/40">
            <CardHeader title="Informations complémentaires requises" />
            <CardBody className="space-y-4">
              {lastInfo?.comment && <p className="flex gap-2 rounded-lg bg-warning-bg p-3 text-sm text-ink"><Icon name="alert" size={18} className="shrink-0 text-warning" />{lastInfo.comment}</p>}
              <RespondInfoForm action={respondInfoAction} id={app.id} />
            </CardBody>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Détails" />
            <CardBody>
              <DescriptionList items={[
                { label: "Banque (fictive)", value: bank.name },
                { label: "Offre", value: `${offer?.name} — ${offer ? accountTypeLabel[offer.accountType] : ""}` },
                { label: "Devise", value: app.currency },
                { label: "Créée le", value: formatDateTime(app.createdAt) },
                { label: "Soumise le", value: app.submittedAt ? formatDateTime(app.submittedAt) : "—" },
                { label: "Demandeur", value: `${app.applicant.firstName} ${app.applicant.lastName}` },
                { label: "Pièce", value: `${app.applicant.idType} · ${app.applicant.idNumber}` },
                { label: "Commune", value: app.applicant.commune },
                { label: "Documents (démo)", value: app.documents.length ? app.documents.map((d) => d.name).join(", ") : "Aucun" },
              ]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Historique" />
            <CardBody><ApplicationTimeline app={app} names={names} /></CardBody>
          </Card>
        </div>
        <SimulationNotice>Demande simulée : elle n&apos;est transmise à aucune banque. Une approbation simulée ne correspond à aucune ouverture de compte réelle.</SimulationNotice>
        {app.status === "draft" && <DeleteDraftForm action={deleteDraftAction} id={app.id} />}
      </div>
    </>
  );
}
