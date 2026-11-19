import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, PageHeader, Pagination, SearchInput, Table, paginate, Mono } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { adminLevelLabel, roleLabel, userStatusLabel, userStatusTone } from "@/lib/labels";
import { formatDate, includesText, sp } from "@/lib/format";
import { formatPhone, fullName } from "@/lib/domain/users";

export const metadata = { title: "Utilisateurs" };

export default async function Users({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  await requirePermission("users.read");
  const db = readDb();
  const role = sp(q.role), status = sp(q.statut), text = sp(q.q);
  const list = db.users.filter((u) => (!role || u.role === role) && (!status || u.status === status) && includesText([fullName(u), u.phone, u.email], text))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const { items, page, pageCount } = paginate(list, Number(sp(q.page)) || 1, 15);
  const href = (p: number) => `/admin/utilisateurs?${new URLSearchParams({ ...(role && { role }), ...(status && { statut: status }), ...(text && { q: text }), page: String(p) })}`;
  return (
    <>
      <PageHeader title="Utilisateurs" subtitle={`${list.length} compte(s)`} />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Nom, téléphone, e-mail…" />
        <FilterSelect name="role" label="Rôle" defaultValue={role} options={Object.entries(roleLabel).map(([value, label]) => ({ value, label }))} />
        <FilterSelect name="statut" label="Statut" defaultValue={status} options={Object.entries(userStatusLabel).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {items.length ? (
          <>
            <Table head={["Nom", "Téléphone", "Rôle", "Statut", "Inscription", "Dernière connexion"]}>
              {items.map((u) => (
                <tr key={u.id} className="hover:bg-canvas">
                  <td><Link href={`/admin/utilisateurs/${u.id}`} className="font-semibold text-navy hover:underline">{fullName(u)}</Link>{u.isDemo && <span className="ml-2 text-xs text-muted">démo</span>}</td>
                  <td><Mono>{formatPhone(u.phone)}</Mono></td>
                  <td>{roleLabel[u.role]}{u.adminLevel && <span className="block text-xs text-muted">{adminLevelLabel[u.adminLevel]}</span>}</td>
                  <td><Badge tone={userStatusTone[u.status]}>{userStatusLabel[u.status]}</Badge></td>
                  <td className="text-muted">{formatDate(u.createdAt)}</td>
                  <td className="text-muted">{u.lastLoginAt ? formatDate(u.lastLoginAt) : "—"}</td>
                </tr>
              ))}
            </Table>
            <Pagination page={page} pageCount={pageCount} hrefFor={href} />
          </>
        ) : <EmptyState icon="users" title="Aucun utilisateur ne correspond" />}
      </Card>
    </>
  );
}
