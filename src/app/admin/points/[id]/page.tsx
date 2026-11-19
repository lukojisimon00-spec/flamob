import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { DescriptionList, PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { PointForm } from "@/components/domain/CatalogForms";
import { savePointAction } from "@/app/actions/admin";
import { agentStatusLabel, agentStatusTone, pointStatusLabel, pointStatusTone, serviceLabel } from "@/lib/labels";
import { fullName } from "@/lib/domain/users";

export default async function PointEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const actor = await requirePermission("agents.read");
  const db = readDb();
  const isNew = id === "nouveau";
  const point = isNew ? undefined : db.servicePoints.find((p) => p.id === id);
  if (!isNew && !point) notFound();
  const manage = can(actor, "points.manage");
  if (isNew && !manage) notFound();
  const agents = point ? db.agents.filter((a) => a.servicePointId === point.id) : [];
  return (
    <>
      <PageHeader back={{ href: "/admin/points", label: "Points de service" }} title={point?.name ?? "Nouveau point de service"} action={point && <Badge tone={pointStatusTone[point.status]}>{pointStatusLabel[point.status]}</Badge>} />
      {q.cree && <div className="mb-4"><Alert tone="success">Point créé. Attribuez-lui un agent depuis la fiche de l&apos;agent.</Alert></div>}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card><CardBody>
          {manage ? <PointForm action={savePointAction} point={point} /> : point && (
            <DescriptionList items={[{ label: "Adresse", value: point.address }, { label: "Commune", value: point.commune }, { label: "Horaires", value: point.hours }, { label: "Services", value: point.services.map((s) => serviceLabel[s]).join(", ") }]} />
          )}
        </CardBody></Card>
        {point && (
          <Card>
            <CardHeader title="Agents rattachés" />
            <CardBody className="space-y-2">
              {agents.length ? agents.map((a) => (
                <Link key={a.id} href={`/admin/agents/${a.id}`} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-canvas">
                  <span>{fullName(db.users.find((u) => u.id === a.userId)!)} <span className="font-mono text-xs text-muted">{a.code}</span></span>
                  <Badge tone={agentStatusTone[a.status]}>{agentStatusLabel[a.status]}</Badge>
                </Link>
              )) : <p className="text-sm text-muted">Aucun agent. L&apos;attribution se fait depuis la fiche d&apos;un agent.</p>}
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
