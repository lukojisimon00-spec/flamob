import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, PageHeader, Pagination, SearchInput, paginate } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { TransactionRow } from "@/components/domain/Transaction";
import { txView } from "@/lib/queries";
import { includesText, sp } from "@/lib/format";
import { dayKey } from "@/lib/domain/time";

export const metadata = { title: "Opérations" };

export default async function AgentOps({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const { agent } = await requireAgent();
  const db = readDb();
  const type = sp(q.type), cur = sp(q.devise), text = sp(q.q), period = sp(q.periode);
  const today = dayKey(new Date());
  const all = db.transactions.filter((t) => t.agentId === agent.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((t) => txView(db, t));
  const list = all.filter((t) => (!type || t.type === type) && (!cur || t.currency === cur) && (!period || dayKey(t.createdAt) === today) && includesText([t.reference, t.clientName, t.bankName, t.clientPhone], text));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 15);
  const href = (p: number) => `/agent/operations?${new URLSearchParams({ ...(type && { type }), ...(cur && { devise: cur }), ...(text && { q: text }), ...(period && { periode: period }), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Opérations simulées" action={<ButtonLink href="/agent/operations/nouvelle" icon="plus" size="sm">Nouvelle</ButtonLink>} />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Référence, client, téléphone…" />
        <FilterSelect name="type" label="Type" defaultValue={type} options={[{ value: "deposit", label: "Dépôts" }, { value: "withdrawal", label: "Retraits" }]} />
        <FilterSelect name="devise" label="Devise" defaultValue={cur} options={[{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }]} />
        <FilterSelect name="periode" label="Période" defaultValue={period} options={[{ value: "jour", label: "Aujourd'hui" }]} />
      </FilterBar>
      <Card>
        {items.length ? (
          <>
            <p className="px-4 pt-3 text-xs text-muted">{list.length} opération(s)</p>
            <ul className="divide-y divide-line">{items.map((t) => <TransactionRow key={t.id} tx={t} href={`/agent/operations/${t.id}`} perspective="agent" />)}</ul>
            <Pagination page={page} pageCount={pageCount} hrefFor={href} />
          </>
        ) : <EmptyState icon="list" title="Aucune opération">Modifiez vos filtres ou enregistrez une nouvelle opération simulée.</EmptyState>}
      </Card>
    </>
  );
}
