import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, Pagination, SearchInput, Table, paginate } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { ApplicationStatusBadge } from "@/components/domain/Status";
import { applicationStatusLabel } from "@/lib/labels";
import { formatDate, includesText, sp } from "@/lib/format";

export const metadata = { title: "Demandes" };

export default async function AppsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("applications.read");
  const db = readDb();
  const status = sp(q.statut), bank = sp(q.banque), text = sp(q.q);
  const list = db.applications.filter((a) => a.status !== "draft" && (!status || a.status === status) && (!bank || a.bankId === bank) &&
    includesText([a.reference, a.applicant.firstName, a.applicant.lastName, a.applicant.phone], text)).sort((a, b) => (b.submittedAt ?? b.createdAt).localeCompare(a.submittedAt ?? a.createdAt));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 15);
  const href = (p: number) => `/admin/demandes?${new URLSearchParams({ ...(status && { statut: status }), ...(bank && { banque: bank }), ...(text && { q: text }), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Demandes d'ouverture de compte" subtitle="Demandes simulées — les décisions n'ont aucun effet bancaire réel." />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Référence, nom, téléphone…" />
        <FilterSelect name="statut" label="Statut" defaultValue={status} options={Object.entries(applicationStatusLabel).filter(([k]) => k !== "draft").map(([value, label]) => ({ value, label }))} />
        <FilterSelect name="banque" label="Banque" defaultValue={bank} options={db.banks.map((b) => ({ value: b.id, label: b.name }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {items.length ? (
          <>
            <Table head={["Référence", "Demandeur", "Banque / offre", "Soumise le", "Statut"]}>
              {items.map((a) => (
                <tr key={a.id} className="hover:bg-canvas">
                  <td><Link href={`/admin/demandes/${a.id}`} className="text-cyan-700 hover:underline"><Mono>{a.reference}</Mono></Link></td>
                  <td className="font-medium">{a.applicant.firstName} {a.applicant.lastName}</td>
                  <td>{db.banks.find((b) => b.id === a.bankId)?.name}<span className="block text-xs text-muted">{db.offers.find((o) => o.id === a.offerId)?.name}</span></td>
                  <td className="text-muted">{a.submittedAt ? formatDate(a.submittedAt) : "—"}</td>
                  <td><ApplicationStatusBadge status={a.status} /></td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageCount={pageCount} hrefFor={href} />
          </>
        ) : <EmptyState icon="file" title="Aucune demande" />}
      </Card>
    </>
  );
}
