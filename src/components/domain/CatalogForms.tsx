"use client";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import type { FormAction } from "@/lib/forms";
import type { Bank, BankOffer, ServicePoint, ServiceType } from "@/lib/db/schema";
import { accountTypeLabel, serviceLabel } from "@/lib/labels";

const major = (m?: { amount: number } | null) => (m ? String(m.amount / 100) : "");

export function PointForm({ action, point }: { action: FormAction; point?: ServicePoint }) {
  return (
    <ActionForm action={action}>
      {point && <input type="hidden" name="id" value={point.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Nom du point"><Input name="name" defaultValue={point?.name} /></Field>
        <Field name="kind" label="Type"><Select name="kind" defaultValue={point?.kind ?? "cabine"}><option value="cabine">Cabine</option><option value="boutique">Boutique</option><option value="kiosque">Kiosque</option></Select></Field>
        <Field name="address" label="Adresse"><Input name="address" defaultValue={point?.address} /></Field>
        <Field name="quarter" label="Quartier"><Input name="quarter" defaultValue={point?.quarter} /></Field>
        <Field name="commune" label="Commune"><Input name="commune" defaultValue={point?.commune} /></Field>
        <Field name="city" label="Ville"><Input name="city" defaultValue={point?.city ?? "Kinshasa"} /></Field>
        <Field name="lat" label="Latitude" hint="Ex. -4.3105"><Input name="lat" inputMode="decimal" className="font-mono" defaultValue={point?.lat ?? -4.33} /></Field>
        <Field name="lng" label="Longitude" hint="Ex. 15.3080"><Input name="lng" inputMode="decimal" className="font-mono" defaultValue={point?.lng ?? 15.31} /></Field>
        <Field name="hours" label="Horaires"><Input name="hours" defaultValue={point?.hours ?? "Lun–Sam · 08:00–18:00"} /></Field>
        <Field name="status" label="Statut"><Select name="status" defaultValue={point?.status ?? "closed"}><option value="open">Ouvert</option><option value="closed">Fermé</option><option value="suspended">Suspendu</option></Select></Field>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">Services proposés</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {(Object.keys(serviceLabel) as ServiceType[]).map((s) => (
            <label key={s} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-cyan-700 has-checked:bg-cyan-50">
              <input type="checkbox" name="services" value={s} defaultChecked={point ? point.services.includes(s) : true} className="size-4 accent-[var(--color-navy)]" />{serviceLabel[s]}
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton>{point ? "Enregistrer" : "Créer le point"}</SubmitButton>
    </ActionForm>
  );
}

export function BankForm({ action, bank }: { action: FormAction; bank?: Bank }) {
  return (
    <ActionForm action={action}>
      {bank && <input type="hidden" name="id" value={bank.id} />}
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem_8rem]">
        <Field name="name" label="Nom (fictif)"><Input name="name" defaultValue={bank?.name} /></Field>
        <Field name="shortName" label="Sigle"><Input name="shortName" maxLength={5} defaultValue={bank?.shortName} className="font-mono uppercase" /></Field>
        <Field name="color" label="Couleur"><Input name="color" type="color" defaultValue={bank?.color ?? "#174B73"} className="p-1" /></Field>
      </div>
      <Field name="tagline" label="Accroche"><Input name="tagline" defaultValue={bank?.tagline} /></Field>
      <Field name="description" label="Description"><Textarea name="description" defaultValue={bank?.description} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="services" label="Services" hint="Un par ligne"><Textarea name="services" defaultValue={bank?.services.join("\n")} /></Field>
        <Field name="eligibility" label="Conditions d'éligibilité" hint="Une par ligne"><Textarea name="eligibility" defaultValue={bank?.eligibility.join("\n")} /></Field>
        <Field name="procedures" label="Démarches" hint="Une étape par ligne"><Textarea name="procedures" defaultValue={bank?.procedures.join("\n")} /></Field>
        <Field name="generalConditions" label="Conditions générales indicatives"><Textarea name="generalConditions" defaultValue={bank?.generalConditions} /></Field>
        <Field name="phone" label="Téléphone" optional><Input name="phone" defaultValue={bank?.contact.phone} /></Field>
        <Field name="email" label="E-mail" optional><Input name="email" defaultValue={bank?.contact.email} /></Field>
        <Field name="website" label="Site web" optional><Input name="website" defaultValue={bank?.contact.website} placeholder="https://" /></Field>
        <Field name="address" label="Adresse" optional><Input name="address" defaultValue={bank?.contact.address} /></Field>
        <Field name="status" label="Statut sur Flamob">
          <Select name="status" defaultValue={bank?.status ?? "coming_soon"}><option value="demo_available">Disponible dans la démo</option><option value="coming_soon">Bientôt</option><option value="inactive">Désactivée</option></Select>
        </Field>
      </div>
      <p className="text-xs text-muted">Toute banque créée dans le prototype est marquée comme fictive. N&apos;ajoutez une banque réelle qu&apos;après la conclusion d&apos;un partenariat.</p>
      <SubmitButton>{bank ? "Enregistrer" : "Créer la banque"}</SubmitButton>
    </ActionForm>
  );
}

export function OfferForm({ action, bankId, offer }: { action: FormAction; bankId: string; offer?: BankOffer }) {
  const feeCur = offer?.openingFee?.currency ?? offer?.monthlyFee?.currency ?? "USD";
  return (
    <ActionForm action={action}>
      <input type="hidden" name="bankId" value={bankId} />
      {offer && <input type="hidden" name="id" value={offer.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="Nom de l'offre"><Input name="name" defaultValue={offer?.name} /></Field>
        <Field name="accountType" label="Type de compte"><Select name="accountType" defaultValue={offer?.accountType ?? "courant"}>{Object.entries(accountTypeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      </div>
      <fieldset className="flex gap-4 text-sm"><legend className="mb-1 font-semibold">Devises du compte</legend>
        {(["USD", "CDF"] as const).map((c) => <label key={c} className="flex items-center gap-2"><input type="checkbox" name="currencies" value={c} defaultChecked={offer ? offer.currencies.includes(c) : c === "USD"} className="size-4 accent-[var(--color-navy)]" />{c}</label>)}
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-4">
        <Field name="feeCurrency" label="Devise des frais"><Select name="feeCurrency" defaultValue={feeCur}><option>USD</option><option>CDF</option></Select></Field>
        <Field name="openingFee" label="Ouverture" hint="Vide = non communiqué"><Input name="openingFee" inputMode="decimal" className="font-mono" defaultValue={major(offer?.openingFee)} /></Field>
        <Field name="monthlyFee" label="Gestion / mois"><Input name="monthlyFee" inputMode="decimal" className="font-mono" defaultValue={major(offer?.monthlyFee)} /></Field>
        <Field name="minDeposit" label="Dépôt initial"><Input name="minDeposit" inputMode="decimal" className="font-mono" defaultValue={major(offer?.minDeposit)} /></Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="conditions" label="Conditions" hint="Une par ligne"><Textarea name="conditions" defaultValue={offer?.conditions.join("\n")} /></Field>
        <Field name="requiredDocuments" label="Documents demandés" hint="Un par ligne"><Textarea name="requiredDocuments" defaultValue={offer?.requiredDocuments.join("\n")} /></Field>
        <Field name="services" label="Services" hint="Un par ligne"><Textarea name="services" defaultValue={offer?.services.join("\n")} /></Field>
        <div className="space-y-4">
          <Field name="withdrawalConditions" label="Conditions de retrait"><Input name="withdrawalConditions" defaultValue={offer?.withdrawalConditions} /></Field>
          <Field name="accessibility" label="Accessibilité"><Input name="accessibility" defaultValue={offer?.accessibility} /></Field>
        </div>
      </div>
      <Checkbox name="active" defaultChecked={offer?.active ?? true} label="Offre active (visible dans le catalogue)" />
      <SubmitButton>{offer ? "Enregistrer l'offre" : "Ajouter l'offre"}</SubmitButton>
    </ActionForm>
  );
}
