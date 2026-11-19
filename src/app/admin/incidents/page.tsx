import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, SearchInput, Table } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { incidentPriorityLabel, incidentPriorityTone, incidentStatusLabel, incidentStatusTone, incidentTypeLabel, roleLabel } from "@/lib/labels";
import { formatDate, includesText, sp } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export const metadata = { title: "Incidents" };

export default async function IncidentsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("incidents.read");
  const db = readDb();
  const status = sp(q.statut), type = sp(q.type), text = sp(q.q);
  const list = db.incidents.filter((i) => (!status || i.status === status) && (!type || i.type === type) && includesText([i.reference, i.title, i.description], text))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <>
      <PageHeader title="Incidents et réclamations" subtitle={`${list.length} signalement(s)`} />
      <FilterBar>
        <SearchInput defaultValue={text} />
        <FilterSelect name="statut" label="Statut" defaultValue={status} options={Object.entries(incidentStatusLabel).map(([value, label]) => ({ value, label }))} />
        <FilterSelect name="type" label="Type" defaultValue={type} options={Object.entries(incidentTypeLabel).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {list.length ? (
          <Table head={["Référence", "Objet", "Type", "Signalé par", "Responsable", "Priorité", "Statut", "Date"]}>
            {list.map((i) => {
              const rep = db.users.find((u) => u.id === i.reporterUserId);
              const asg = db.users.find((u) => u.id === i.assigneeUserId);
              return (
                <tr key={i.id} className="hover:bg-canvas">
                  <td><Link href={`/admin/incidents/${i.id}`} className="text-cyan-700 hover:underline"><Mono>{i.reference}</Mono></Link></td>
                  <td className="max-w-64 font-medium">{i.title}</td>
                  <td className="text-muted">{incidentTypeLabel[i.type]}</td>
                  <td>{rep ? fullName(rep) : "—"}<span className="block text-xs text-muted">{rep ? roleLabel[rep.role] : ""}</span></td>
                  <td>{asg ? fullName(asg) : <span className="text-muted">—</span>}</td>
                  <td><Badge tone={incidentPriorityTone[i.priority]}>{incidentPriorityLabel[i.priority]}</Badge></td>
                  <td><Badge tone={incidentStatusTone[i.status]}>{incidentStatusLabel[i.status]}</Badge></td>
                  <td className="text-muted">{formatDate(i.createdAt)}</td>
                </tr>
              );
            })}
          </Table>
        ) : <EmptyState icon="check" title="Aucun incident" />}
      </Card>
    </>
  );
}
