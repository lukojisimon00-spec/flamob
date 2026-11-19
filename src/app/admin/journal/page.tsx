import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, Pagination, SearchInput, Table, paginate } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { formatDateTime, includesText, sp } from "@/lib/format";
import { fullName } from "@/lib/domain/users";

export const metadata = { title: "Journal d'activité" };

export default async function Journal({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("audit.read");
  const db = readDb();
  const entity = sp(q.entite), text = sp(q.q);
  const entities = [...new Set(db.auditLogs.map((l) => l.entity))].sort();
  const nameOf = (id?: string) => { const u = db.users.find((x) => x.id === id); return u ? fullName(u) : "Système / anonyme"; };
  const list = [...db.auditLogs].reverse().filter((l) => (!entity || l.entity === entity) && includesText([l.action, l.details, nameOf(l.actorUserId)], text));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 25);
  return (
    <>
      <PageHeader title="Journal d'activité" subtitle="Traçabilité des actions sensibles (connexions, opérations, décisions, configuration)." />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Action, auteur, détail…" />
        <FilterSelect name="entite" label="Entité" defaultValue={entity} options={entities.map((e) => ({ value: e, label: e }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {items.length ? (
          <>
            <Table head={["Date", "Auteur", "Action", "Entité", "Détails"]}>
              {items.map((l) => (
                <tr key={l.id}>
                  <td className="whitespace-nowrap text-muted">{formatDateTime(l.at)}</td>
                  <td>{nameOf(l.actorUserId)}</td>
                  <td><Mono className="text-cyan-700">{l.action}</Mono></td>
                  <td><Mono>{l.entity}</Mono></td>
                  <td className="max-w-80 text-muted">{l.details ?? "—"}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageCount={pageCount} hrefFor={(p) => `/admin/journal?${new URLSearchParams({ ...(entity && { entite: entity }), ...(text && { q: text }), page: String(p) })}`} />
          </>
        ) : <EmptyState icon="journal" title="Aucune entrée" />}
      </Card>
    </>
  );
}
