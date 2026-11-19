import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { FilterBar, FilterSelect, Mono, PageHeader, SearchInput, Table } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { agentStatusLabel, agentStatusTone } from "@/lib/labels";
import { includesText, sp } from "@/lib/format";
import { agentStats, agentView } from "@/lib/queries";
import { formatMoney } from "@/lib/money";

export const metadata = { title: "Agents" };

export default async function AgentsAdmin({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const actor = await requirePermission("agents.read");
  const db = readDb();
  const status = sp(q.statut), text = sp(q.q);
  const rows = db.agents.map((a) => agentView(db, a.id)!).filter((v) => (!status || v.agent.status === status) && includesText([v.name, v.agent.code, v.point?.name, v.point?.commune], text));
  return (
    <>
      <PageHeader title="Agents" subtitle={`${rows.length} agent(s)`} action={can(actor, "agents.manage") ? <ButtonLink href="/admin/agents/nouveau" icon="plus" size="sm">Ajouter un agent</ButtonLink> : undefined} />
      <FilterBar>
        <SearchInput defaultValue={text} placeholder="Nom, code, point, commune…" />
        <FilterSelect name="statut" label="Statut" defaultValue={status} options={Object.entries(agentStatusLabel).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      <Card className="overflow-hidden">
        {rows.length ? (
          <Table head={["Agent", "Code", "Point de service", "Statut", "Espèces USD (sim.)", "Opérations", "Commissions USD (sim.)"]}>
            {rows.map((v) => {
              const s = agentStats(db, v.agent.id);
              const usd = db.cashBalances.find((b) => b.agentId === v.agent.id && b.currency === "USD");
              const low = usd && usd.cash < db.settings.liquidityAlert.USD;
              return (
                <tr key={v.agent.id} className="hover:bg-canvas">
                  <td><Link href={`/admin/agents/${v.agent.id}`} className="font-semibold text-navy hover:underline">{v.name}</Link></td>
                  <td><Mono>{v.agent.code}</Mono></td>
                  <td>{v.point?.name ?? <span className="text-muted">Non attribué</span>}<span className="block text-xs text-muted">{v.point?.commune}</span></td>
                  <td><Badge tone={agentStatusTone[v.agent.status]}>{agentStatusLabel[v.agent.status]}</Badge></td>
                  <td className={low ? "text-danger" : ""}><Mono>{formatMoney(usd?.cash ?? 0, "USD")}</Mono></td>
                  <td><Mono>{s.totalCount}</Mono></td>
                  <td><Mono>{formatMoney(s.commissionsTotal.USD, "USD")}</Mono></td>
                </tr>
              );
            })}
          </Table>
        ) : <EmptyState icon="user" title="Aucun agent" />}
      </Card>
    </>
  );
}
