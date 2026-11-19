import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { AgentOperationForm } from "@/components/domain/AgentOperationForm";
import { agentExecuteAction, agentQuoteAction } from "@/app/actions/agent";
import type { OperationType } from "@/lib/db/schema";
import { sp } from "@/lib/format";

export const metadata = { title: "Nouvelle opération" };

export default async function NewAgentOp({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const { agent } = await requireAgent();
  const db = readDb();
  const services = (["deposit", "withdrawal"] as OperationType[]).filter((s) => agent.authorizedServices.includes(s) && db.settings.enabledServices.includes(s));
  const point = db.servicePoints.find((p) => p.id === agent.servicePointId);
  const blocked = agent.status !== "active" || point?.status !== "open";
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader back={{ href: "/agent/operations", label: "Opérations" }} title="Nouvelle opération simulée" subtitle="Aucun compte réel n'est crédité ou débité." />
      {blocked ? <Alert tone="warning" title="Opérations bloquées">Votre statut ou celui de votre point de service ne permet pas d&apos;opérer. Contactez votre superviseur.</Alert>
        : services.length === 0 ? <Alert tone="warning">Aucun service d&apos;opération ne vous est attribué.</Alert>
        : <AgentOperationForm banks={db.banks.filter((b) => b.status === "demo_available").map((b) => ({ id: b.id, name: b.name }))} currencies={db.settings.enabledCurrencies}
            services={services} initialType={(sp(q.type) as OperationType) || "deposit"} quoteAction={agentQuoteAction} executeAction={agentExecuteAction} />}
    </div>
  );
}
