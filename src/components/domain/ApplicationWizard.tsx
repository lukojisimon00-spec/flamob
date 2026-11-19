"use client";
import { useEffect, useRef, useState } from "react";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton, useFormCtx } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert, SimulationNotice } from "@/components/ui/feedback";
import { Icon } from "@/components/ui/icons";
import { DocumentPicker } from "./DocumentPicker";
import { BankLogo } from "./BankLogo";
import type { AccountApplication, Bank, BankOffer, Currency } from "@/lib/db/schema";
import type { FormAction } from "@/lib/forms";
import { accountTypeLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money";

const STEPS = ["Banque", "Offre", "Conditions", "Informations", "Documents", "Vérification"];
const FIELD_STEP: Record<string, number> = {
  bankId: 0, offerId: 1, currency: 1, readConditions: 2, firstName: 3, lastName: 3, birthDate: 3, idType: 3, idNumber: 3,
  address: 3, commune: 3, occupation: 3, email: 3, documents: 4, accept: 5,
};

function JumpToError({ setStep }: { setStep: (n: number) => void }) {
  const { state } = useFormCtx();
  useEffect(() => {
    const first = Object.keys(state.fieldErrors ?? {})[0];
    if (first && FIELD_STEP[first] !== undefined) setStep(FIELD_STEP[first]);
  }, [state, setStep]);
  return null;
}

export function ApplicationWizard({ action, banks, offers, user, draft, initialBankId, initialOfferId }: {
  action: FormAction; banks: Bank[]; offers: BankOffer[];
  user: { firstName: string; lastName: string; email?: string; commune?: string; phone: string };
  draft?: AccountApplication; initialBankId?: string; initialOfferId?: string;
}) {
  const [step, setStep] = useState(draft ? 3 : initialOfferId ? 2 : initialBankId ? 1 : 0);
  const [bankId, setBankId] = useState(draft?.bankId ?? initialBankId ?? "");
  const [offerId, setOfferId] = useState(draft?.offerId ?? initialOfferId ?? "");
  const [currency, setCurrency] = useState<Currency>(draft?.currency ?? "USD");
  const [stepError, setStepError] = useState("");
  const panels = useRef<(HTMLDivElement | null)[]>([]);
  const bank = banks.find((b) => b.id === bankId);
  const offer = offers.find((o) => o.id === offerId && o.bankId === bankId);
  const a = draft?.applicant;

  useEffect(() => { if (offer && !offer.currencies.includes(currency)) setCurrency(offer.currencies[0]); }, [offer, currency]);

  const next = () => {
    if (step === 0 && !bank) return setStepError("Choisissez une banque.");
    if (step === 1 && !offer) return setStepError("Choisissez une offre.");
    const panel = panels.current[step];
    const invalid = panel ? Array.from(panel.querySelectorAll<HTMLInputElement>("input,select,textarea")).find((el) => !el.checkValidity()) : undefined;
    if (invalid) { invalid.reportValidity(); return; }
    setStepError("");
    if (step + 1 === STEPS.length - 1) {
      // Capture les valeurs réellement saisies (y compris pré-remplies) pour le récapitulatif.
      const snap: Record<string, string> = {};
      panels.current[3]?.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input,select").forEach((el) => { if (el.name) snap[el.name] = el.value; });
      setValues(snap);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const show = (i: number) => (i === step ? "space-y-4" : "hidden");
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <ActionForm action={action} className="space-y-5">
      <JumpToError setStep={setStep} />
      {draft && <input type="hidden" name="id" value={draft.id} />}
      <input type="hidden" name="bankId" value={bankId} />
      <input type="hidden" name="offerId" value={offerId} />

      <ol className="flex gap-1.5" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${i <= step ? "bg-cyan" : "bg-line"}`} />
            <span className={`mt-1.5 hidden text-xs sm:block ${i === step ? "font-semibold text-navy" : "text-muted"}`}>{s}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted sm:hidden">Étape {step + 1} sur {STEPS.length} · <span className="font-semibold text-navy">{STEPS[step]}</span></p>
      {stepError && <Alert tone="danger">{stepError}</Alert>}

      <div>
        <div ref={(el) => { panels.current[0] = el; }} className={show(0)}>
          <h2 className="text-lg font-semibold">Choisissez une banque</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {banks.map((b) => (
              <button type="button" key={b.id} onClick={() => { setBankId(b.id); if (offers.find((o) => o.id === offerId)?.bankId !== b.id) setOfferId(""); setStepError(""); }}
                aria-pressed={bankId === b.id}
                className={`flex items-center gap-3 rounded-[var(--radius-card)] border p-3.5 text-left ${bankId === b.id ? "border-cyan-700 bg-cyan-50 ring-1 ring-cyan-700" : "border-line bg-surface hover:border-line-strong"}`}>
                <BankLogo name={b.name} shortName={b.shortName} color={b.color} size={40} />
                <span className="min-w-0"><span className="block font-semibold">{b.name}</span><span className="block truncate text-xs text-muted">{b.tagline}</span></span>
              </button>
            ))}
          </div>
        </div>

        <div ref={(el) => { panels.current[1] = el; }} className={show(1)}>
          <h2 className="text-lg font-semibold">Choisissez une offre {bank && <span className="text-muted">· {bank.name}</span>}</h2>
          <div className="grid gap-2.5">
            {offers.filter((o) => o.bankId === bankId).map((o) => (
              <button type="button" key={o.id} onClick={() => { setOfferId(o.id); setStepError(""); }} aria-pressed={offerId === o.id}
                className={`rounded-[var(--radius-card)] border p-4 text-left ${offerId === o.id ? "border-cyan-700 bg-cyan-50 ring-1 ring-cyan-700" : "border-line bg-surface hover:border-line-strong"}`}>
                <span className="flex items-start justify-between gap-3">
                  <span><span className="block text-xs font-semibold uppercase text-cyan-700">{accountTypeLabel[o.accountType]}</span><span className="block font-semibold">{o.name}</span></span>
                  <span className="font-mono text-xs text-muted">{o.currencies.join(" · ")}</span>
                </span>
                <span className="mt-2 block text-sm text-muted">
                  Ouverture : {o.openingFee ? (o.openingFee.amount ? formatMoney(o.openingFee.amount, o.openingFee.currency) : "gratuite") : "n.c."} · Gestion : {o.monthlyFee ? (o.monthlyFee.amount ? `${formatMoney(o.monthlyFee.amount, o.monthlyFee.currency)}/mois` : "gratuite") : "n.c."} (indicatif)
                </span>
              </button>
            ))}
          </div>
          {offer && (
            <Field name="currency" label="Devise du compte">
              <Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                {offer.currencies.map((c) => <option key={c} value={c}>{c === "USD" ? "Dollar américain (USD)" : "Franc congolais (CDF)"}</option>)}
              </Select>
            </Field>
          )}
        </div>

        <div ref={(el) => { panels.current[2] = el; }} className={show(2)}>
          <h2 className="text-lg font-semibold">Conditions de l&apos;offre</h2>
          {offer && bank && (
            <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm">
              <div><p className="font-semibold">Éligibilité</p><ul className="mt-1 space-y-1 text-ink-soft">{bank.eligibility.map((e) => <li key={e} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 text-cyan-700" />{e}</li>)}</ul></div>
              <div><p className="font-semibold">Conditions</p><ul className="mt-1 space-y-1 text-ink-soft">{offer.conditions.map((e) => <li key={e} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 text-cyan-700" />{e}</li>)}</ul></div>
              <div><p className="font-semibold">Documents demandés</p><ul className="mt-1 space-y-1 text-ink-soft">{offer.requiredDocuments.map((e) => <li key={e} className="flex gap-2"><Icon name="file" size={16} className="mt-0.5 text-muted" />{e}</li>)}</ul></div>
              <p className="text-ink-soft"><span className="font-semibold text-ink">Retraits : </span>{offer.withdrawalConditions}</p>
              <p className="text-xs text-warning">Conditions indicatives d&apos;une banque fictive.</p>
            </div>
          )}
          <Checkbox name="readConditions" required label="J'ai pris connaissance des conditions indicatives de cette offre." defaultChecked={!!draft} />
        </div>

        <div ref={(el) => { panels.current[3] = el; }} className={show(3)}>
          <h2 className="text-lg font-semibold">Vos informations</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field name="lastName" label="Nom"><Input name="lastName" required minLength={2} defaultValue={a?.lastName ?? user.lastName} autoComplete="family-name" /></Field>
            <Field name="firstName" label="Prénom"><Input name="firstName" required minLength={2} defaultValue={a?.firstName ?? user.firstName} autoComplete="given-name" /></Field>
            <Field name="birthDate" label="Date de naissance"><Input name="birthDate" type="date" required defaultValue={a?.birthDate} /></Field>
            <Field name="occupation" label="Profession"><Input name="occupation" required minLength={2} defaultValue={a?.occupation} /></Field>
            <Field name="idType" label="Pièce d'identité">
              <Select name="idType" defaultValue={a?.idType ?? "Carte d'électeur"}>{["Carte d'électeur", "Passeport", "Permis de conduire", "Carte d'étudiant"].map((x) => <option key={x}>{x}</option>)}</Select>
            </Field>
            <Field name="idNumber" label="Numéro de la pièce" hint="Démonstration : saisissez une valeur fictive (ex. DEMO-123456)."><Input name="idNumber" required minLength={3} defaultValue={a?.idNumber} /></Field>
            <Field name="address" label="Adresse"><Input name="address" required minLength={4} defaultValue={a?.address} autoComplete="street-address" /></Field>
            <Field name="commune" label="Commune"><Input name="commune" required minLength={2} defaultValue={a?.commune ?? user.commune} /></Field>
            <Field name="email" label="E-mail" optional><Input name="email" type="email" defaultValue={a?.email ?? user.email} /></Field>
            <div className="space-y-1.5"><p className="text-sm font-semibold">Téléphone</p><p className="flex h-11 items-center rounded-[var(--radius-control)] bg-canvas px-3.5 font-mono text-sm">{user.phone}</p></div>
          </div>
        </div>

        <div ref={(el) => { panels.current[4] = el; }} className={show(4)}>
          <h2 className="text-lg font-semibold">Documents de démonstration</h2>
          <DocumentPicker initial={draft?.documents} kinds={offer?.requiredDocuments.length ? offer.requiredDocuments : ["Pièce d'identité"]} />
        </div>

        <div className={show(5)}>
          <h2 className="text-lg font-semibold">Vérifiez votre demande</h2>
          <Recap bank={bank} offer={offer} currency={currency} values={values} draft={draft} user={user} />
          <SimulationNotice>Cette demande est simulée : elle n&apos;est pas transmise à une banque et ne donne lieu à l&apos;ouverture d&apos;aucun compte réel.</SimulationNotice>
          <Checkbox name="accept" label="Je comprends que cette demande est une simulation." />
        </div>
      </div>

      <div className="space-y-3 border-t border-line pt-4">
        <div className="flex items-center justify-between gap-2">
          {step > 0 ? <Button type="button" variant="ghost" icon="arrowLeft" onClick={() => setStep(step - 1)}>Retour</Button> : <span />}
          {step < STEPS.length - 1 ? <Button type="button" onClick={next} iconRight="arrowRight">Continuer</Button> : <SubmitButton name="intent" value="submit" icon="check">Soumettre</SubmitButton>}
        </div>
        {step >= 3 && <div className="flex justify-end"><SubmitButton variant="ghost" size="sm" name="intent" value="draft">Enregistrer comme brouillon</SubmitButton></div>}
      </div>
    </ActionForm>
  );
}

function Recap({ bank, offer, currency, values, draft, user }: { bank?: Bank; offer?: BankOffer; currency: Currency; values: Record<string, string>; draft?: AccountApplication; user: { firstName: string; lastName: string } }) {
  const v = (k: keyof AccountApplication["applicant"], fallback = "—") => values[k] || (draft?.applicant[k] as string | undefined) || fallback;
  const rows: [string, string][] = [
    ["Banque", bank?.name ?? "—"], ["Offre", offer?.name ?? "—"], ["Devise", currency],
    ["Nom complet", `${v("firstName", user.firstName)} ${v("lastName", user.lastName)}`], ["Date de naissance", v("birthDate")],
    ["Pièce", `${v("idType", "Carte d'électeur")} · ${v("idNumber")}`], ["Adresse", `${v("address")}, ${v("commune")}`], ["Profession", v("occupation")],
  ];
  return (
    <dl className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface px-4">
      {rows.map(([k, val]) => <div key={k} className="flex justify-between gap-4 py-2.5 text-sm"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{val}</dd></div>)}
    </dl>
  );
}
