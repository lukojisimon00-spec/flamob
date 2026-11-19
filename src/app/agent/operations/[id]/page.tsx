import { notFound } from "next/navigation";
import { requireAgent } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Receipt } from "@/components/domain/Transaction";
import { txView } from "@/lib/queries";

export default async function AgentTx({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const { agent } = await requireAgent();
  const db = readDb();
  const tx = db.transactions.find((t) => t.id === id && t.agentId === agent.id);
  if (!tx) notFound();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader back={{ href: "/agent/operations", label: "Opérations" }} title="Reçu de démonstration" />
      {q.nouveau && <div className="mb-4"><Alert tone="success" title="Opération simulée enregistrée">Remettez la référence <span className="font-mono">{tx.reference}</span> au client.</Alert></div>}
      <Receipt tx={txView(db, tx)} showCommission />
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/agent/operations/nouvelle" icon="plus">Nouvelle opération</ButtonLink>
        <ButtonLink href={`/agent/incidents?reference=${tx.reference}`} variant="ghost" icon="alert">Signaler un problème</ButtonLink>
      </div>
    </div>
  );
}
