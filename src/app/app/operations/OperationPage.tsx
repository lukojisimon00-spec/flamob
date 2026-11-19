import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { OperationWizard } from "@/components/domain/OperationWizard";
import { executeOperationAction, quoteOperationAction } from "@/app/actions/client";
import { operationalAgents } from "@/lib/queries";
import type { OperationType } from "@/lib/db/schema";

export async function OperationPage({ type }: { type: OperationType }) {
  const user = await requireClient();
  const db = readDb();
  const banks = db.banks.filter((b) => b.status === "demo_available");
  const accounts = db.demoAccounts.filter((a) => a.userId === user.id && banks.some((b) => b.id === a.bankId)).map((a) => ({
    id: a.id, bankId: a.bankId, bankName: banks.find((b) => b.id === a.bankId)!.name, label: a.label, masked: a.maskedNumber, currency: a.currency,
  }));
  const agents = operationalAgents(db, type).map((v) => ({ id: v.agent.id, name: v.name, code: v.agent.code, pointName: v.point!.name, commune: v.point!.commune, hours: v.point!.hours }));
  const enabled = db.settings.enabledServices.includes(type);
  return (
    <>
      <PageHeader back={{ href: "/app", label: "Accueil" }} title={type === "deposit" ? "Dépôt simulé" : "Retrait simulé"}
        subtitle={type === "deposit" ? "Simulez un dépôt d'espèces chez un agent Flamob." : "Simulez un retrait d'espèces chez un agent Flamob."} />
      {enabled ? (
        <OperationWizard type={type} accounts={accounts} banks={banks.map((b) => ({ id: b.id, name: b.name }))} agents={agents}
          limits={db.settings.limits} currencies={db.settings.enabledCurrencies} quoteAction={quoteOperationAction} executeAction={executeOperationAction} />
      ) : <Alert tone="warning" title="Service désactivé">Ce service est momentanément désactivé par l&apos;administration.</Alert>}
    </>
  );
}
