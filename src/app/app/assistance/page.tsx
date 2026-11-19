import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icons";
import { IncidentForm } from "@/components/domain/ProfileForms";
import { reportIncidentAction } from "@/app/actions/client";
import { incidentStatusLabel, incidentStatusTone } from "@/lib/labels";
import { formatDate, sp } from "@/lib/format";

export const metadata = { title: "Assistance" };

export default async function Support({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const user = await requireClient();
  const db = readDb();
  const mine = db.incidents.filter((i) => i.reporterUserId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Assistance" subtitle="Une question, une réclamation, un comportement suspect ?" />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card><CardHeader title="Contacter l'équipe Flamob" /><CardBody><IncidentForm action={reportIncidentAction} reference={sp(q.reference) || undefined} /></CardBody></Card>
        <div className="space-y-5">
          <Card>
            <CardHeader title="Contacts (démo)" />
            <CardBody className="space-y-2 text-sm">
              <p className="flex items-center gap-2"><Icon name="phone" size={16} className="text-muted" />{db.settings.supportPhone}</p>
              <p className="flex items-center gap-2"><Icon name="mail" size={16} className="text-muted" />{db.settings.supportEmail}</p>
              <p className="rounded-lg bg-warning-bg p-3 text-ink-soft">Personne chez Flamob ne vous demandera votre mot de passe bancaire ou votre code PIN.</p>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Mes signalements" />
            {mine.length ? (
              <ul className="mt-2 divide-y divide-line">
                {mine.map((i) => (
                  <li key={i.id} className="space-y-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{i.title}</p><Badge tone={incidentStatusTone[i.status]}>{incidentStatusLabel[i.status]}</Badge></div>
                    <p className="font-mono text-xs text-muted">{i.reference} · {formatDate(i.createdAt)}</p>
                    {i.comments.at(-1) && <p className="rounded-lg bg-canvas p-2 text-xs text-ink-soft">Réponse : {i.comments.at(-1)!.text}</p>}
                  </li>
                ))}
              </ul>
            ) : <CardBody><p className="text-sm text-muted">Aucun signalement.</p></CardBody>}
          </Card>
        </div>
      </div>
    </>
  );
}
