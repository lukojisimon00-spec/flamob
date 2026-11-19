import { notFound } from "next/navigation";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, SimTag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { BankLogo } from "@/components/domain/BankLogo";
import { Price } from "@/components/domain/OfferBits";
import { accountTypeLabel, bankStatusLabel, bankStatusTone } from "@/lib/labels";

export default async function BankDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = readDb();
  const bank = db.banks.find((b) => b.slug === slug && b.status !== "inactive");
  if (!bank) notFound();
  const offers = db.offers.filter((o) => o.bankId === bank.id && o.active);
  const available = bank.status === "demo_available";
  return (
    <>
      <PageHeader back={{ href: "/app/banques", label: "Banques" }} title={bank.name} />
      <div className="space-y-5">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-start gap-4">
              <BankLogo name={bank.name} shortName={bank.shortName} color={bank.color} size={56} />
              <div className="space-y-2">
                <p className="text-ink-soft">{bank.description}</p>
                <div className="flex flex-wrap gap-1.5"><SimTag>Banque fictive</SimTag><Badge tone={bankStatusTone[bank.status]}>{bankStatusLabel[bank.status]} sur Flamob</Badge></div>
              </div>
            </div>
            {bank.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">{bank.services.map((s) => <span key={s} className="rounded-md bg-navy-50 px-2 py-1 text-xs font-medium text-navy-700">{s}</span>)}</div>
            )}
          </CardBody>
        </Card>

        <section aria-labelledby="offres" className="space-y-3">
          <h2 id="offres" className="text-lg font-semibold">Types de comptes ({offers.length})</h2>
          {!offers.length && <Alert tone="info">Aucune offre n&apos;est encore disponible pour cette banque dans la démonstration.</Alert>}
          <div className="grid gap-3 md:grid-cols-2">
            {offers.map((o) => (
              <Card key={o.id} as="article">
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{accountTypeLabel[o.accountType]}</p>
                      <h3 className="text-base font-semibold">{o.name}</h3>
                    </div>
                    <span className="font-mono text-xs text-muted">{o.currencies.join(" · ")}</span>
                  </div>
                  <dl className="grid grid-cols-3 gap-2 rounded-xl bg-canvas p-3 text-center">
                    <div><dt className="text-[0.7rem] text-muted">Ouverture</dt><dd className="text-sm font-semibold"><Price value={o.openingFee} /></dd></div>
                    <div><dt className="text-[0.7rem] text-muted">Gestion / mois</dt><dd className="text-sm font-semibold"><Price value={o.monthlyFee} /></dd></div>
                    <div><dt className="text-[0.7rem] text-muted">Dépôt initial</dt><dd className="text-sm font-semibold"><Price value={o.minDeposit} /></dd></div>
                  </dl>
                  <p className="text-xs text-warning">Frais indicatifs non vérifiés — données de démonstration.</p>
                  <div className="text-sm">
                    <p className="font-semibold">Conditions</p>
                    <ul className="mt-1 space-y-1 text-ink-soft">{o.conditions.map((c) => <li key={c} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-cyan-700" />{c}</li>)}</ul>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold">Documents demandés</p>
                    <ul className="mt-1 space-y-1 text-ink-soft">{o.requiredDocuments.map((c) => <li key={c} className="flex gap-2"><Icon name="file" size={16} className="mt-0.5 shrink-0 text-muted" />{c}</li>)}</ul>
                  </div>
                  <p className="text-sm text-ink-soft"><span className="font-semibold text-ink">Retraits : </span>{o.withdrawalConditions}</p>
                  <p className="text-sm text-ink-soft"><span className="font-semibold text-ink">Accessibilité : </span>{o.accessibility}</p>
                  {available && <ButtonLink href={`/app/demandes/nouvelle?banque=${bank.id}&offre=${o.id}`} block icon="file">Simuler une demande</ButtonLink>}
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader title="Démarches" />
            <CardBody>
              {bank.procedures.length ? (
                <ol className="space-y-2 text-sm">{bank.procedures.map((p, i) => <li key={p} className="flex gap-3"><span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>{p}</li>)}</ol>
              ) : <p className="text-sm text-muted">Non communiqué.</p>}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Éligibilité et conditions générales" />
            <CardBody className="space-y-3 text-sm">
              {bank.eligibility.length > 0 && <ul className="space-y-1">{bank.eligibility.map((e) => <li key={e} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-cyan-700" />{e}</li>)}</ul>}
              <p className="text-ink-soft">{bank.generalConditions}</p>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Coordonnées (fictives)" />
          <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
            {bank.contact.phone && <p className="flex items-center gap-2"><Icon name="phone" size={16} className="text-muted" />{bank.contact.phone}</p>}
            {bank.contact.email && <p className="flex items-center gap-2"><Icon name="mail" size={16} className="text-muted" />{bank.contact.email}</p>}
            {bank.contact.website && <p className="flex items-center gap-2"><Icon name="info" size={16} className="text-muted" />{bank.contact.website}</p>}
            {bank.contact.address && <p className="flex items-center gap-2"><Icon name="pin" size={16} className="text-muted" />{bank.contact.address}</p>}
            {!Object.values(bank.contact).some(Boolean) && <p className="text-muted">Non communiqué.</p>}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
