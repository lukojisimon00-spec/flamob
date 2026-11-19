import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, Pagination, SearchInput, Table, paginate, filterInput } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { txView } from "@/lib/queries";
import { operationLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { formatDateTime, includesText, sp } from "@/lib/format";

export const metadata = { title: "Opérations" };

export default async function OpsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("operations.read");
  const db = readDb();
  const type = sp(q.type), cur = sp(q.devise), agent = sp(q.agent), text = sp(q.q), from = sp(q.du), to = sp(q.au);
  const list = db.transactions.filter((t) => (!type || t.type === type) && (!cur || t.currency === cur) && (!agent || t.agentId === agent) &&
    (!from || t.createdAt.slice(0, 10) >= from) && (!to || t.createdAt.slice(0, 10) <= to))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((t) => txView(db, t))
    .filter((t) => includesText([t.reference, t.clientName, t.agentName, t.bankName], text));
  const totals = (["USD", "CDF"] as const).map((c) => ({ c, v: list.filter((t) => t.currency === c).reduce((s, t) => s + t.amount, 0) }));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 20);
  const href = (p: number) => `/admin/operations?${new URLSearchParams({ ...(type && { type }), ...(cur && { devise: cur }), ...(agent && { agent }), ...(text && { q: text }), ...(from && { du: from }), ...(to && { au: to }), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Opérations simulées" subtitle={`${list.length} opération(s) · ${totals.map((t) => formatMoney(t.v, t.c)).join(" · ")}`} />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Référence, client, agent, banque…" />
        <FilterSelect name="type" label="Type" defaultValue={type} options={[{ value: "deposit", label: "Dépôts" }, { value: "withdrawal", label: "Retraits" }]} />
        <FilterSelect name="devise" label="Devise" defaultValue={cur} options={[{ value: "USD", label: "USD" }, { value: "CDF", label: "CDF" }]} />
        <FilterSelect name="agent" label="Agent" defaultValue={agent} options={db.agents.map((a) => ({ value: a.id, label: a.code }))} />
        <label className="flex items-center gap-1 text-sm text-muted">Du <input type="date" name="du" defaultValue={from} className={filterInput} /></label>
        <label className="flex items-center gap-1 text-sm text-muted">au <input type="date" name="au" defaultValue={to} className={filterInput} /></label>
      </FilterBar>
      <Card className="overflow-hidden">
        {items.length ? (
          <>
            <Table head={["Date", "Référence", "Type", "Client", "Agent", "Banque", "Montant", "Frais", "Statut"]}>
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-canvas">
                  <td className="whitespace-nowrap text-muted">{formatDateTime(t.createdAt)}</td>
                  <td><Link href={`/admin/operations/${t.id}`} className="text-cyan-700 hover:underline"><Mono>{t.reference}</Mono></Link></td>
                  <td>{operationLabel[t.type]}</td>
                  <td>{t.clientName}{t.initiatedBy === "client" && <span className="block text-xs text-muted">via l&apos;app</span>}</td>
                  <td><Mono>{t.agentCode}</Mono></td>
                  <td className="text-muted">{t.bankName}</td>
                  <td><Mono>{formatMoney(t.amount, t.currency)}</Mono></td>
                  <td><Mono>{formatMoney(t.fee, t.currency)}</Mono></td>
                  <td><Badge tone="success">Simulée</Badge></td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageCount={pageCount} hrefFor={href} />
          </>
        ) : <EmptyState icon="receipt" title="Aucune opération" />}
      </Card>
    </>
  );
}
