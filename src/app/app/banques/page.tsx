import { readDb } from "@/lib/db/store";
import { PageHeader, FilterBar, SearchInput, FilterSelect } from "@/components/ui/data";
import { BankCard } from "@/components/domain/Cards";
import { ButtonLink } from "@/components/ui/button";
import { Alert, EmptyState } from "@/components/ui/feedback";
import { accountTypeLabel } from "@/lib/labels";
import { includesText, sp } from "@/lib/format";
import type { AccountType } from "@/lib/db/schema";

export const metadata = { title: "Banques" };

export default async function Banks({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const db = readDb();
  const type = sp(q.type) as AccountType | "";
  const banks = db.banks.filter((b) => b.status !== "inactive")
    .filter((b) => includesText([b.name, b.tagline, ...b.services], sp(q.q)))
    .filter((b) => !type || db.offers.some((o) => o.bankId === b.id && o.active && o.accountType === type));
  return (
    <>
      <PageHeader title="Banques" subtitle="Découvrez les établissements disponibles dans la démonstration." action={<ButtonLink href="/app/comparateur" variant="secondary" size="sm" icon="compare">Comparer</ButtonLink>} />
      <div className="mb-4"><Alert tone="info" title="Banques fictives">Ces établissements ont été créés pour la démonstration. Aucun partenariat bancaire réel n&apos;est revendiqué.</Alert></div>
      <FilterBar>
        <SearchInput defaultValue={sp(q.q)} placeholder="Rechercher une banque ou un service" />
        <FilterSelect name="type" label="Type de compte" defaultValue={type} options={Object.entries(accountTypeLabel).map(([value, label]) => ({ value, label }))} />
      </FilterBar>
      {banks.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {banks.map((b) => <li key={b.id}><BankCard bank={b} href={`/app/banques/${b.slug}`} offerCount={db.offers.filter((o) => o.bankId === b.id && o.active).length} /></li>)}
        </ul>
      ) : <EmptyState icon="bank" title="Aucune banque ne correspond">Modifiez votre recherche ou vos filtres.</EmptyState>}
    </>
  );
}
