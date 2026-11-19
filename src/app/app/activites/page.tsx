import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, PageHeader, Pagination, SearchInput, paginate } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { TransactionRow } from "@/components/domain/Transaction";
import { txView } from "@/lib/queries";
import { includesText, sp } from "@/lib/format";

export const metadata = { title: "Activités" };

export default async function Activity({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const user = await requireClient();
  const db = readDb();
  const type = sp(q.type), cur = sp(q.devise), text = sp(q.q);
  const all = db.transactions.filter((t) => t.clientUserId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((t) => txView(db, t));
  const filtered = all.filter((t) => (!type || t.type === type) && (!cur || t.currency === cur) && includesText([t.reference, t.bankName, t.agentName, t.pointName], text));
  const { items, page, pageCount } = paginate(filtered, Number(sp(q.page)) || 1, 12);
  const params = (p: number) => `/app/activites?${new URLSearchParams({ ...(type && { type }), ...(cur && { devise: cur }), ...(text && { q: text }), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Activités" subtitle="Historique de vos opérations simulées." />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Référence, banque, agent…" />
        <FilterSelect name="type" label="Type" defaultValue={type} options={[{ value: "deposit", label: "Dépôts" }, { value: "withdrawal", label: "Retraits" }]} />
        <FilterSelect name="devise" label="Devise" defaultValue={cur} options={[{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }]} />
      </FilterBar>
      <Card>
        {items.length ? (
          <>
            <p className="px-4 pt-3 text-xs text-muted">{filtered.length} opération{filtered.length > 1 ? "s" : ""} simulée{filtered.length > 1 ? "s" : ""}</p>
            <ul className="divide-y divide-line">{items.map((t) => <TransactionRow key={t.id} tx={t} href={`/app/operations/${t.id}`} />)}</ul>
            <Pagination page={page} pageCount={pageCount} hrefFor={params} />
          </>
        ) : (
          <EmptyState icon="activity" title={all.length ? "Aucun résultat" : "Aucune opération pour le moment"}
            action={!all.length && <ButtonLink href="/app/operations/depot" size="sm" icon="arrowDown">Simuler un dépôt</ButtonLink>}>
            {all.length ? "Modifiez vos filtres." : "Vos dépôts et retraits simulés apparaîtront ici."}
          </EmptyState>
        )}
      </Card>
    </>
  );
}
