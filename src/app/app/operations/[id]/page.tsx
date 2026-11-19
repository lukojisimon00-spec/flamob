import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { Receipt } from "@/components/domain/Transaction";
import { txView } from "@/lib/queries";

export const metadata = { title: "Reçu de démonstration" };

export default async function TxDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const user = await requireClient();
  const db = readDb();
  const tx = db.transactions.find((t) => t.id === id && t.clientUserId === user.id);
  if (!tx) notFound();
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader back={{ href: "/app/activites", label: "Activités" }} title="Reçu de démonstration" />
      {q.nouveau && <div className="mb-4"><Alert tone="success" title="Simulation enregistrée">Conservez la référence <span className="font-mono">{tx.reference}</span>.</Alert></div>}
      <Receipt tx={txView(db, tx)} />
      <div className="mt-4 flex flex-wrap gap-2">
        <ButtonLink href="/app" variant="secondary" icon="home">Accueil</ButtonLink>
        <ButtonLink href={`/app/assistance?reference=${tx.reference}`} variant="ghost" icon="help">Signaler un problème</ButtonLink>
      </div>
    </div>
  );
}
