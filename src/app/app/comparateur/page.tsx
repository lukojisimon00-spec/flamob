import Link from "next/link";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/domain/OfferBits";
import { accountTypeLabel } from "@/lib/labels";
import type { ReactNode } from "react";

export const metadata = { title: "Comparateur" };

export default async function Compare({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const q = await searchParams;
  const db = readDb();
  const offers = db.offers.filter((o) => o.active && db.banks.some((b) => b.id === o.bankId && b.status === "demo_available"));
  const raw = q.o ? (Array.isArray(q.o) ? q.o : [q.o]) : offers.slice(0, 3).map((o) => o.id);
  const selected = raw.map((id) => offers.find((o) => o.id === id)).filter(Boolean).slice(0, 4) as typeof offers;
  const bankOf = (id: string) => db.banks.find((b) => b.id === id)!;

  const rows: { label: string; cell: (o: (typeof offers)[number]) => ReactNode }[] = [
    { label: "Banque", cell: (o) => bankOf(o.bankId).name },
    { label: "Type de compte", cell: (o) => accountTypeLabel[o.accountType] },
    { label: "Devises", cell: (o) => <span className="font-mono">{o.currencies.join(" · ")}</span> },
    { label: "Frais d'ouverture", cell: (o) => <Price value={o.openingFee} /> },
    { label: "Frais de gestion / mois", cell: (o) => <Price value={o.monthlyFee} /> },
    { label: "Dépôt initial", cell: (o) => <Price value={o.minDeposit} /> },
    { label: "Conditions", cell: (o) => o.conditions.join(" · ") },
    { label: "Conditions de retrait", cell: (o) => o.withdrawalConditions },
    { label: "Services", cell: (o) => o.services.join(" · ") },
    { label: "Accessibilité", cell: (o) => o.accessibility },
    { label: "Informations", cell: (o) => o.infoVerified ? <Badge tone="success">Vérifiées</Badge> : <Badge tone="warning">Indicatives, non vérifiées</Badge> },
    { label: "", cell: (o) => <Link className="font-semibold text-cyan-700 hover:underline" href={`/app/demandes/nouvelle?banque=${o.bankId}&offre=${o.id}`}>Simuler une demande</Link> },
  ];

  return (
    <>
      <PageHeader back={{ href: "/app/banques", label: "Banques" }} title="Comparateur d'offres" subtitle="Sélectionnez jusqu'à 4 offres." />
      <div className="mb-4"><Alert tone="warning" title="Informations indicatives">Les frais et conditions des banques fictives sont illustratifs et non vérifiés. Ils ne constituent pas une offre.</Alert></div>
      <Card className="mb-5">
        <form method="get" className="space-y-3 p-4">
          <fieldset>
            <legend className="text-sm font-semibold">Offres à comparer</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {offers.map((o) => (
                <label key={o.id} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-cyan-700 has-checked:bg-cyan-50">
                  <input type="checkbox" name="o" value={o.id} defaultChecked={selected.some((s) => s.id === o.id)} className="size-4 accent-[var(--color-navy)]" />
                  <span className="min-w-0"><span className="block truncate font-medium">{o.name}</span><span className="block truncate text-xs text-muted">{bankOf(o.bankId).name}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className="h-10 rounded-[var(--radius-control)] bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-700">Comparer la sélection</button>
        </form>
      </Card>
      {selected.length > 0 && (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="sticky left-0 z-10 w-36 bg-surface px-4 py-3 text-left text-xs uppercase text-muted">Critère</th>
                  {selected.map((o) => <th key={o.id} scope="col" className="px-4 py-3 text-left font-semibold">{o.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r, i) => (
                  <tr key={i}>
                    <th scope="row" className="sticky left-0 bg-surface px-4 py-3 text-left align-top text-xs font-semibold text-muted">{r.label}</th>
                    {selected.map((o) => <td key={o.id} className="px-4 py-3 align-top text-ink-soft">{r.cell(o)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {selected.length > 4 && <p className="mt-2 text-sm text-muted">Seules les 4 premières offres sont affichées.</p>}
    </>
  );
}
