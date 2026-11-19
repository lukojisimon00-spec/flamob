import { notFound } from "next/navigation";
import { requireClient } from "@/lib/auth/session";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { ApplicationWizard } from "@/components/domain/ApplicationWizard";
import { saveApplicationAction } from "@/app/actions/client";
import { sp } from "@/lib/format";

export const metadata = { title: "Nouvelle demande" };

export default async function NewApplication({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const user = await requireClient();
  const db = readDb();
  const banks = db.banks.filter((b) => b.status === "demo_available");
  const offers = db.offers.filter((o) => o.active && banks.some((b) => b.id === o.bankId));
  const draftId = sp(q.brouillon);
  const draft = draftId ? db.applications.find((a) => a.id === draftId && a.userId === user.id && a.status === "draft") : undefined;
  if (draftId && !draft) notFound();
  return (
    <>
      <PageHeader back={{ href: "/app/demandes", label: "Mes demandes" }} title={draft ? "Compléter le brouillon" : "Demande d'ouverture de compte"} subtitle="Parcours simulé — aucun compte réel ne sera ouvert." />
      <ApplicationWizard action={saveApplicationAction} banks={banks} offers={offers} draft={draft}
        initialBankId={sp(q.banque) || undefined} initialOfferId={sp(q.offre) || undefined}
        user={{ firstName: user.firstName, lastName: user.lastName, email: user.email, commune: user.commune, phone: user.phone }} />
    </>
  );
}
