import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { BankCard } from "@/components/domain/Cards";

export const metadata = { title: "Banques" };

export default async function BanksAdmin() {
  const actor = await requirePermission("dashboard.read");
  const db = readDb();
  return (
    <>
      <PageHeader title="Banques de démonstration" action={can(actor, "banks.manage") ? <ButtonLink href="/admin/banques/nouveau" icon="plus" size="sm">Ajouter une banque</ButtonLink> : undefined} />
      <div className="mb-4"><Alert tone="info">Toutes les banques sont fictives. Une architecture d&apos;intégration partenaire est prévue (voir docs/ARCHITECTURE.md) ; aucun partenariat n&apos;est revendiqué.</Alert></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {db.banks.map((b) => <li key={b.id}><BankCard bank={b} href={`/admin/banques/${b.id}`} offerCount={db.offers.filter((o) => o.bankId === b.id).length} /></li>)}
      </ul>
    </>
  );
}
