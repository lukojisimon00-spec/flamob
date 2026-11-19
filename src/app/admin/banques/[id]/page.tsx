import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { readDb } from "@/lib/db/store";
import { PageHeader } from "@/components/ui/data";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { BankForm, OfferForm } from "@/components/domain/CatalogForms";
import { Price } from "@/components/domain/OfferBits";
import { saveBankAction, saveOfferAction } from "@/app/actions/admin";
import { accountTypeLabel } from "@/lib/labels";
import { sp } from "@/lib/format";

export default async function BankAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[]>> }) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const actor = await requirePermission("dashboard.read");
  const manage = can(actor, "banks.manage");
  const db = readDb();
  const isNew = id === "nouveau";
  const bank = isNew ? undefined : db.banks.find((b) => b.id === id);
  if ((!isNew && !bank) || (isNew && !manage)) notFound();
  const offers = bank ? db.offers.filter((o) => o.bankId === bank.id) : [];
  const editing = sp(q.offre);
  const editOffer = offers.find((o) => o.id === editing);
  return (
    <>
      <PageHeader back={{ href: "/admin/banques", label: "Banques" }} title={bank?.name ?? "Nouvelle banque (fictive)"} />
      {q.cree && <div className="mb-4"><Alert tone="success">Banque créée. Ajoutez ses offres ci-dessous.</Alert></div>}
      {q.offre_ok && <div className="mb-4"><Alert tone="success">Offre enregistrée.</Alert></div>}
      <div className="space-y-5">
        {manage ? <Card><CardHeader title="Informations" /><CardBody><BankForm action={saveBankAction} bank={bank} /></CardBody></Card>
          : <Alert tone="info">Consultation seule : vous n&apos;avez pas la permission de modifier les banques.</Alert>}
        {bank && (
          <Card>
            <CardHeader title={`Offres (${offers.length})`} action={manage && editing !== "nouvelle" ? <ButtonLink href={`/admin/banques/${bank.id}?offre=nouvelle#offre`} size="sm" icon="plus" variant="secondary">Ajouter</ButtonLink> : undefined} />
            <ul className="mt-2 divide-y divide-line">
              {offers.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div>
                    <p className="font-semibold">{o.name} <span className="text-sm font-normal text-muted">· {accountTypeLabel[o.accountType]} · {o.currencies.join("/")}</span></p>
                    <p className="text-sm text-muted">Ouverture <Price value={o.openingFee} /> · Gestion <Price value={o.monthlyFee} /> · Dépôt initial <Price value={o.minDeposit} /></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={o.active ? "success" : "neutral"}>{o.active ? "Active" : "Inactive"}</Badge>
                    {manage && <Link href={`/admin/banques/${bank.id}?offre=${o.id}#offre`} className="text-sm font-semibold text-cyan-700 hover:underline">Modifier</Link>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
        {bank && manage && (editing === "nouvelle" || editOffer) && (
          <Card><div id="offre" /><CardHeader title={editOffer ? `Modifier « ${editOffer.name} »` : "Nouvelle offre"} subtitle="Frais indicatifs non vérifiés." /><CardBody><OfferForm action={saveOfferAction} bankId={bank.id} offer={editOffer} /></CardBody></Card>
        )}
      </div>
    </>
  );
}
