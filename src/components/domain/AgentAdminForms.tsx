"use client";
import { ActionForm, Field, Input, Select, SubmitButton } from "@/components/ui/form";
import type { FormAction } from "@/lib/forms";
import type { AgentStatus, ServiceType } from "@/lib/db/schema";
import { serviceLabel } from "@/lib/labels";

function ServiceChecks({ selected }: { selected: ServiceType[] }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">Services autorisés (démo)</legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {(Object.keys(serviceLabel) as ServiceType[]).map((s) => (
          <label key={s} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2 text-sm has-checked:border-cyan-700 has-checked:bg-cyan-50">
            <input type="checkbox" name="authorizedServices" value={s} defaultChecked={selected.includes(s)} className="size-4 accent-[var(--color-navy)]" />{serviceLabel[s]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function AgentCreateForm({ action, points }: { action: FormAction; points: { id: string; name: string }[] }) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="lastName" label="Nom"><Input name="lastName" /></Field>
        <Field name="firstName" label="Prénom"><Input name="firstName" /></Field>
        <Field name="phone" label="Téléphone"><Input name="phone" type="tel" inputMode="tel" /></Field>
        <Field name="email" label="E-mail" optional><Input name="email" type="email" /></Field>
        <Field name="servicePointId" label="Point de service">
          <Select name="servicePointId" defaultValue=""><option value="">Non attribué</option>{points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        </Field>
      </div>
      <ServiceChecks selected={["assistance", "account_support"]} />
      <p className="text-xs text-muted">Le compte est créé sans mot de passe utilisable : l&apos;agent le définit via « Mot de passe oublié » (code SMS simulé). La trésorerie démarre à zéro.</p>
      <SubmitButton icon="plus">Créer l&apos;agent</SubmitButton>
    </ActionForm>
  );
}

export function AgentEditForm({ action, agentId, status, servicePointId, services, points }: {
  action: FormAction; agentId: string; status: AgentStatus; servicePointId?: string; services: ServiceType[]; points: { id: string; name: string }[];
}) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="agentId" value={agentId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="status" label="Statut">
          <Select name="status" defaultValue={status}><option value="active">Actif</option><option value="inactive">Inactif</option><option value="suspended">Suspendu</option></Select>
        </Field>
        <Field name="servicePointId" label="Point de service">
          <Select name="servicePointId" defaultValue={servicePointId ?? ""}><option value="">Non attribué</option>{points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        </Field>
      </div>
      <ServiceChecks selected={services} />
      <SubmitButton>Enregistrer</SubmitButton>
    </ActionForm>
  );
}

export function TreasuryAdjustForm({ action, agentId }: { action: FormAction; agentId: string }) {
  return (
    <ActionForm action={action} resetOnSuccess>
      <input type="hidden" name="agentId" value={agentId} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="currency" label="Devise"><Select name="currency"><option>USD</option><option>CDF</option></Select></Field>
        <Field name="cashDelta" label="Espèces (±)" hint="Ex. 500 ou -200"><Input name="cashDelta" inputMode="decimal" className="font-mono" defaultValue="0" /></Field>
        <Field name="floatDelta" label="Compensation (±)"><Input name="floatDelta" inputMode="decimal" className="font-mono" defaultValue="0" /></Field>
      </div>
      <Field name="note" label="Motif"><Input name="note" placeholder="Rééquilibrage simulé de fin de journée" /></Field>
      <SubmitButton variant="secondary" icon="refresh">Appliquer l&apos;ajustement simulé</SubmitButton>
    </ActionForm>
  );
}
