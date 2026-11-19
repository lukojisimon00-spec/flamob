import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { DescriptionList, Mono, PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IncidentUpdateForm } from "@/components/domain/ConfigForms";
import { updateIncidentAction } from "@/app/actions/admin";
import { incidentPriorityLabel, incidentPriorityTone, incidentStatusLabel, incidentStatusTone, incidentTypeLabel, roleLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export default async function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await requirePermission("incidents.read");
  const db = readDb();
  const inc = db.incidents.find((i) => i.id === id);
  if (!inc) notFound();
  const nameOf = (uid?: string) => { const u = db.users.find((x) => x.id === uid); return u ? fullName(u) : "—"; };
  const rep = db.users.find((u) => u.id === inc.reporterUserId);
  const tx = inc.transactionReference ? db.transactions.find((t) => t.reference === inc.transactionReference) : undefined;
  const timeline = [...inc.history.map((h) => ({ at: h.at, who: h.byUserId, text: h.change, kind: "h" })), ...inc.comments.map((c) => ({ at: c.at, who: c.byUserId, text: c.text, kind: "c" }))].sort((a, b) => b.at.localeCompare(a.at));
  return (
    <>
      <PageHeader back={{ href: "/admin/incidents", label: "Incidents" }} title={inc.title} subtitle={<Mono>{inc.reference}</Mono>}
        action={<div className="flex gap-1.5"><Badge tone={incidentPriorityTone[inc.priority]}>{incidentPriorityLabel[inc.priority]}</Badge><Badge tone={incidentStatusTone[inc.status]}>{incidentStatusLabel[inc.status]}</Badge></div>} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <Card><CardHeader title="Description" /><CardBody><p className="whitespace-pre-line text-sm text-ink-soft">{inc.description}</p></CardBody></Card>
          {can(actor, "incidents.manage") && <Card><CardHeader title="Traitement" /><CardBody>
            <IncidentUpdateForm action={updateIncidentAction} incident={inc} admins={db.users.filter((u) => u.role === "admin" && u.status === "active").map((u) => ({ id: u.id, name: fullName(u) }))} />
          </CardBody></Card>}
          <Card>
            <CardHeader title="Historique et commentaires" />
            <CardBody>
              <ol className="space-y-3">
                {timeline.map((t, i) => (
                  <li key={i} className={`rounded-lg p-3 text-sm ${t.kind === "c" ? "bg-cyan-50" : "bg-canvas"}`}>
                    <p className="text-xs text-muted">{formatDateTime(t.at)} · {nameOf(t.who)}{t.kind === "c" ? " · commentaire" : ""}</p>
                    <p className="mt-0.5">{t.text}</p>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>
        </div>
        <Card>
          <CardHeader title="Informations" />
          <CardBody>
            <DescriptionList items={[
              { label: "Type", value: incidentTypeLabel[inc.type] },
              { label: "Signalé par", value: rep ? <Link className="font-semibold text-cyan-700 hover:underline" href={`/admin/utilisateurs/${rep.id}`}>{fullName(rep)}</Link> : "—" },
              { label: "Rôle", value: rep ? roleLabel[rep.role] : "—" },
              { label: "Responsable", value: nameOf(inc.assigneeUserId) },
              { label: "Opération liée", value: tx ? <Link className="text-cyan-700 hover:underline" href={`/admin/operations/${tx.id}`}><Mono>{tx.reference}</Mono></Link> : inc.transactionReference ?? "—" },
              { label: "Créé le", value: formatDateTime(inc.createdAt) },
              { label: "Mis à jour", value: formatDateTime(inc.updatedAt) },
            ]} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}
