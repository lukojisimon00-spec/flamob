import { requirePermission } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody } from "@/components/ui/card";
import { AgentCreateForm } from "@/components/domain/AgentAdminForms";
import { createAgentAction } from "@/app/actions/admin";

export const metadata = { title: "Nouvel agent" };

export default async function NewAgent() {
  await requirePermission("agents.manage");
  const points = readDb().servicePoints.map((p) => ({ id: p.id, name: `${p.name} (${p.commune})` }));
  return (
    <div className="max-w-3xl">
      <PageHeader back={{ href: "/admin/agents", label: "Agents" }} title="Ajouter un agent" />
      <Card><CardBody><AgentCreateForm action={createAgentAction} points={points} /></CardBody></Card>
    </div>
  );
}
