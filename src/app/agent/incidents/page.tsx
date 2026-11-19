import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncidentForm } from "@/components/domain/ProfileForms";
import { reportIncidentAction } from "@/app/actions/client";
import { incidentStatusLabel, incidentStatusTone, incidentTypeLabel } from "@/lib/labels";
import { formatDate, sp } from "@/lib/format";

export const metadata = { title: "Signalements" };

export default async function AgentIncidents({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const { user } = await requireAgent();
  const mine = readDb().incidents.filter((i) => i.reporterUserId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Signaler un problème" subtitle="Problème opérationnel, liquidité, technique ou de sécurité." />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card><CardBody><IncidentForm action={reportIncidentAction} reference={sp(q.reference) || undefined} withPriority types={["operational", "liquidity", "technical", "security", "error", "complaint", "other"]} /></CardBody></Card>
        <Card>
          <CardHeader title="Mes signalements" />
          {mine.length ? (
            <ul className="mt-2 divide-y divide-line">
              {mine.map((i) => (
                <li key={i.id} className="space-y-1 px-4 py-3">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{i.title}</p><Badge tone={incidentStatusTone[i.status]}>{incidentStatusLabel[i.status]}</Badge></div>
                  <p className="text-xs text-muted"><span className="font-mono">{i.reference}</span> · {incidentTypeLabel[i.type]} · {formatDate(i.createdAt)}</p>
                  {i.comments.at(-1) && <p className="rounded-lg bg-canvas p-2 text-xs text-ink-soft">Réponse : {i.comments.at(-1)!.text}</p>}
                </li>
              ))}
            </ul>
          ) : <CardBody><p className="text-sm text-muted">Aucun signalement.</p></CardBody>}
        </Card>
      </div>
    </>
  );
}
