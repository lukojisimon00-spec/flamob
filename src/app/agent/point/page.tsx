import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { DescriptionList, PageHeader, StatTile } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { BarChart } from "@/components/ui/BarChart";
import { dailySeries } from "@/lib/queries";
import { formatDate } from "@/lib/format";
import { pointStatusLabel, pointStatusTone, serviceLabel } from "@/lib/labels";

export const metadata = { title: "Point de service" };

export default async function PointPage() {
  const { agent } = await requireAgent();
  const db = readDb();
  const point = db.servicePoints.find((p) => p.id === agent.servicePointId);
  if (!point) return <><PageHeader title="Point de service" /><Alert tone="warning">Aucun point de service ne vous est attribué. Contactez l&apos;administration.</Alert></>;
  const txs = db.transactions.filter((t) => t.servicePointId === point.id);
  const series = dailySeries(db, 30, (t) => t.servicePointId === point.id).map((d) => ({ key: d.day, label: `${d.day.slice(8)}/${d.day.slice(5, 7)}`, value: d.count }));
  const agentsHere = db.agents.filter((a) => a.servicePointId === point.id).length;
  return (
    <>
      <PageHeader back={{ href: "/agent/profil", label: "Profil" }} title={point.name} subtitle={<span className="font-mono">{point.code}</span>} action={<Badge tone={pointStatusTone[point.status]}>{pointStatusLabel[point.status]}</Badge>} />
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <StatTile label="Opérations (total)" value={txs.length} icon="activity" />
          <StatTile label="Agents rattachés" value={agentsHere} icon="users" />
          <StatTile label="Ouvert depuis" value={formatDate(point.createdAt)} icon="clock" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Informations" subtitle="Modifiables uniquement par l'administration." />
            <CardBody>
              <DescriptionList items={[
                { label: "Type", value: point.kind === "cabine" ? "Cabine" : point.kind === "kiosque" ? "Kiosque" : "Boutique" },
                { label: "Adresse", value: point.address },
                { label: "Quartier", value: point.quarter },
                { label: "Commune", value: `${point.commune}, ${point.city}` },
                { label: "Horaires", value: point.hours },
                { label: "Coordonnées (fictives)", value: <span className="font-mono">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</span> },
                { label: "Services", value: point.services.map((s) => serviceLabel[s]).join(", ") },
              ]} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Historique simulé — 30 jours" />
            <CardBody><BarChart data={series} label="Opérations simulées par jour au point de service" /></CardBody>
          </Card>
        </div>
        <ButtonLink href="/agent/incidents" variant="secondary" icon="alert">Signaler un problème sur le point</ButtonLink>
      </div>
    </>
  );
}
