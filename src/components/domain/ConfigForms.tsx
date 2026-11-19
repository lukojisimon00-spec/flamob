"use client";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import type { FormAction } from "@/lib/forms";
import type { Announcement, CommissionRule, Incident, Settings } from "@/lib/db/schema";
import { audienceLabel, incidentStatusLabel, serviceLabel } from "@/lib/labels";

const mj = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v / 100));

export function CommissionRuleForm({ action, rule, agents }: { action: FormAction; rule?: CommissionRule; agents: { id: string; label: string }[] }) {
  return (
    <ActionForm action={action} resetOnSuccess={!rule}>
      {rule && <input type="hidden" name="id" value={rule.id} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="operationType" label="Opération"><Select name="operationType" defaultValue={rule?.operationType ?? "deposit"}><option value="deposit">Dépôt</option><option value="withdrawal">Retrait</option></Select></Field>
        <Field name="currency" label="Devise"><Select name="currency" defaultValue={rule?.currency ?? "USD"}><option>USD</option><option>CDF</option></Select></Field>
        <Field name="agentId" label="Cible"><Select name="agentId" defaultValue={rule?.agentId ?? ""}><option value="">Tous les agents</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</Select></Field>
        <Field name="fixed" label="Part fixe"><Input name="fixed" inputMode="decimal" className="font-mono" defaultValue={mj(rule?.fixed) || "0"} /></Field>
        <Field name="percent" label="Part variable (%)"><Input name="percent" inputMode="decimal" className="font-mono" defaultValue={rule ? String(rule.percentBp / 100) : "0"} /></Field>
        <Field name="min" label="Minimum"><Input name="min" inputMode="decimal" className="font-mono" defaultValue={mj(rule?.min) || "0"} /></Field>
        <Field name="max" label="Maximum" hint="Vide = sans plafond"><Input name="max" inputMode="decimal" className="font-mono" defaultValue={mj(rule?.max)} /></Field>
      </div>
      <Checkbox name="active" defaultChecked={rule?.active ?? true} label="Règle active" />
      <SubmitButton>{rule ? "Enregistrer la règle" : "Ajouter la règle"}</SubmitButton>
    </ActionForm>
  );
}

export function IncidentUpdateForm({ action, incident, admins }: { action: FormAction; incident: Incident; admins: { id: string; name: string }[] }) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name="id" value={incident.id} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="status" label="Statut"><Select name="status" defaultValue={incident.status}>{Object.entries(incidentStatusLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
        <Field name="priority" label="Priorité"><Select name="priority" defaultValue={incident.priority}><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></Select></Field>
        <Field name="assigneeUserId" label="Responsable"><Select name="assigneeUserId" defaultValue={incident.assigneeUserId ?? ""}><option value="">Non affecté</option>{admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
      </div>
      <Field name="comment" label="Commentaire" optional hint="Visible par la personne ayant signalé l'incident."><Textarea name="comment" maxLength={1000} /></Field>
      <SubmitButton>Mettre à jour</SubmitButton>
    </ActionForm>
  );
}

export function AnnouncementForm({ action, draft }: { action: FormAction; draft?: Announcement }) {
  return (
    <ActionForm action={action} resetOnSuccess={!draft}>
      {draft && <input type="hidden" name="id" value={draft.id} />}
      <Field name="title" label="Titre"><Input name="title" maxLength={100} defaultValue={draft?.title} /></Field>
      <Field name="body" label="Message"><Textarea name="body" maxLength={600} defaultValue={draft?.body} /></Field>
      <Field name="audience" label="Ciblage"><Select name="audience" defaultValue={draft?.audience ?? "all"}>{Object.entries(audienceLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="intent" value="draft" variant="secondary">Enregistrer le brouillon</SubmitButton>
        <SubmitButton name="intent" value="publish" icon="megaphone">Publier</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function SettingsForm({ action, s, readOnly }: { action: FormAction; s: Settings; readOnly: boolean }) {
  return (
    <ActionForm action={action} className="space-y-6">
      <fieldset disabled={readOnly} className="space-y-6">
        <section className="space-y-3">
          <h2 className="font-semibold">Frais simulés</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="depositPct" label="Dépôt — %"><Input name="depositPct" className="font-mono" defaultValue={s.fees.deposit.percentBp / 100} /></Field>
            <Field name="depositMinUSD" label="Dépôt — min USD"><Input name="depositMinUSD" className="font-mono" defaultValue={mj(s.fees.deposit.min.USD)} /></Field>
            <Field name="depositMinCDF" label="Dépôt — min CDF"><Input name="depositMinCDF" className="font-mono" defaultValue={mj(s.fees.deposit.min.CDF)} /></Field>
            <Field name="withdrawalPct" label="Retrait — %"><Input name="withdrawalPct" className="font-mono" defaultValue={s.fees.withdrawal.percentBp / 100} /></Field>
            <Field name="withdrawalMinUSD" label="Retrait — min USD"><Input name="withdrawalMinUSD" className="font-mono" defaultValue={mj(s.fees.withdrawal.min.USD)} /></Field>
            <Field name="withdrawalMinCDF" label="Retrait — min CDF"><Input name="withdrawalMinCDF" className="font-mono" defaultValue={mj(s.fees.withdrawal.min.CDF)} /></Field>
          </div>
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold">Limites simulées</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field name="minUSD" label="Minimum USD"><Input name="minUSD" className="font-mono" defaultValue={mj(s.limits.USD.min)} /></Field>
            <Field name="maxOpUSD" label="Max / opération USD"><Input name="maxOpUSD" className="font-mono" defaultValue={mj(s.limits.USD.maxPerOperation)} /></Field>
            <Field name="maxDayUSD" label="Plafond jour / client USD"><Input name="maxDayUSD" className="font-mono" defaultValue={mj(s.limits.USD.maxPerDayPerClient)} /></Field>
            <Field name="minCDF" label="Minimum CDF"><Input name="minCDF" className="font-mono" defaultValue={mj(s.limits.CDF.min)} /></Field>
            <Field name="maxOpCDF" label="Max / opération CDF"><Input name="maxOpCDF" className="font-mono" defaultValue={mj(s.limits.CDF.maxPerOperation)} /></Field>
            <Field name="maxDayCDF" label="Plafond jour / client CDF"><Input name="maxDayCDF" className="font-mono" defaultValue={mj(s.limits.CDF.maxPerDayPerClient)} /></Field>
            <Field name="alertUSD" label="Seuil d'alerte liquidité USD"><Input name="alertUSD" className="font-mono" defaultValue={mj(s.liquidityAlert.USD)} /></Field>
            <Field name="alertCDF" label="Seuil d'alerte liquidité CDF"><Input name="alertCDF" className="font-mono" defaultValue={mj(s.liquidityAlert.CDF)} /></Field>
          </div>
        </section>
        <section className="grid gap-6 sm:grid-cols-2">
          <fieldset className="space-y-2"><legend className="font-semibold">Services activés</legend>
            {(Object.keys(serviceLabel) as (keyof typeof serviceLabel)[]).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabledServices" value={k} defaultChecked={s.enabledServices.includes(k)} className="size-4 accent-[var(--color-navy)]" />{serviceLabel[k]}</label>)}
          </fieldset>
          <fieldset className="space-y-2"><legend className="font-semibold">Devises activées</legend>
            {(["USD", "CDF"] as const).map((c) => <label key={c} className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabledCurrencies" value={c} defaultChecked={s.enabledCurrencies.includes(c)} className="size-4 accent-[var(--color-navy)]" />{c}</label>)}
          </fieldset>
        </section>
        <section className="grid gap-4 sm:grid-cols-2">
          <Field name="supportPhone" label="Téléphone d'assistance"><Input name="supportPhone" defaultValue={s.supportPhone} /></Field>
          <Field name="supportEmail" label="E-mail d'assistance"><Input name="supportEmail" defaultValue={s.supportEmail} /></Field>
        </section>
        <Checkbox name="registrationOpen" defaultChecked={s.registrationOpen} label="Inscriptions publiques ouvertes (démonstration)" />
        {!readOnly && <SubmitButton>Enregistrer les paramètres</SubmitButton>}
      </fieldset>
    </ActionForm>
  );
}
