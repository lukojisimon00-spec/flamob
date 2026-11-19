import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { AgentNetwork, type NetworkEntry } from "@/components/domain/AgentNetwork";
import { fullName } from "@/lib/domain/users";
import { sp } from "@/lib/format";

export const metadata = { title: "Réseau d'agents" };

export default async function Agents({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const db = readDb();
  // Les agents suspendus/inactifs et les points suspendus ne sont pas affichés au public.
  const entries: NetworkEntry[] = db.agents.filter((a) => a.status === "active").flatMap((a) => {
    const point = db.servicePoints.find((p) => p.id === a.servicePointId);
    const user = db.users.find((u) => u.id === a.userId);
    if (!point || !user || point.status === "suspended") return [];
    return [{ agentId: a.id, name: fullName(user), code: a.code, services: a.authorizedServices, point }];
  });
  return (
    <>
      <PageHeader title="Réseau d'agents" subtitle="Points de service Flamob près de chez vous." />
      <div className="mb-4"><Alert tone="info">Agents, adresses et horaires fictifs (démonstration). Un agent Flamob ne vous demandera jamais votre mot de passe bancaire.</Alert></div>
      <AgentNetwork entries={entries} initialPoint={sp(q.point) || undefined} />
    </>
  );
}
