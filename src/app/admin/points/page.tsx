import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, SearchInput, Table } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { pointStatusLabel, pointStatusTone } from "@/lib/labels";
import { includesText, sp } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export const metadata = { title: "Points de service" };

export default async function Points({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const actor = await requirePermission("agents.read");
  const db = readDb();
  const status = sp(q.statut), text = sp(q.q);
  const list = db.servicePoints.filter((p) => (!status || p.status === status) && includesText([p.name, p.code, p.commune, p.quarter], text));
  return (
    <>
      <PageHeader title="Points de service" subtitle="Cabines, boutiques et kiosques du réseau (fictifs)." action={can(actor, "points.manage") ? <ButtonLink href="/admin/points/nouveau" icon="plus" size="sm">Nouveau point</ButtonLink> : undefined} />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Nom, code, commune…" />
        <FilterSelect name="statut" label="Statut" defaultValue={status} options={Object.entries(pointStatusLabel).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {list.length ? (
          <Table head={["Point", "Code", "Localisation", "Horaires", "Agents", "Statut"]}>
            {list.map((p) => {
              const agents = db.agents.filter((a) => a.servicePointId === p.id).map((a) => fullName(db.users.find((u) => u.id === a.userId)!));
              return (
                <tr key={p.id} className="hover:bg-canvas">
                  <td><Link href={`/admin/points/${p.id}`} className="font-semibold text-navy hover:underline">{p.name}</Link></td>
                  <td><Mono>{p.code}</Mono></td>
                  <td>{p.commune}<span className="block text-xs text-muted">{p.quarter}</span></td>
                  <td className="text-muted">{p.hours}</td>
                  <td>{agents.join(", ") || <span className="text-muted">Aucun</span>}</td>
                  <td><Badge tone={pointStatusTone[p.status]}>{pointStatusLabel[p.status]}</Badge></td>
                </tr>
              );
            })}
          </Table>
        ) : <EmptyState icon="store" title="Aucun point" />}
      </Card>
    </>
  );
}
