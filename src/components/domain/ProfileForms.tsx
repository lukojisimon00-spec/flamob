"use client";
import { ActionForm, Checkbox, Field, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";
import type { FormAction } from "@/lib/forms";
import type { User } from "@/lib/db/schema";
import { incidentTypeLabel } from "@/lib/labels";

export function ProfileForm({ action, user }: { action: FormAction; user: Pick<User, "firstName" | "lastName" | "email" | "city" | "commune" | "preferredCurrency" | "notifyBySms"> }) {
  return (
    <ActionForm action={action}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="lastName" label="Nom"><Input name="lastName" defaultValue={user.lastName} /></Field>
        <Field name="firstName" label="Prénom"><Input name="firstName" defaultValue={user.firstName} /></Field>
        <Field name="email" label="E-mail" optional><Input name="email" type="email" defaultValue={user.email} /></Field>
        <Field name="preferredCurrency" label="Devise préférée">
          <Select name="preferredCurrency" defaultValue={user.preferredCurrency}><option value="USD">Dollar (USD)</option><option value="CDF">Franc congolais (CDF)</option></Select>
        </Field>
        <Field name="city" label="Ville" optional><Input name="city" defaultValue={user.city} /></Field>
        <Field name="commune" label="Commune" optional><Input name="commune" defaultValue={user.commune} /></Field>
      </div>
      <Checkbox name="notifyBySms" defaultChecked={user.notifyBySms} label="Recevoir aussi les alertes par SMS (lorsque le service sera disponible)" />
      <SubmitButton>Enregistrer</SubmitButton>
    </ActionForm>
  );
}

export function PasswordForm({ action }: { action: FormAction }) {
  return (
    <ActionForm action={action} resetOnSuccess>
      <Field name="current" label="Mot de passe actuel"><Input name="current" type="password" autoComplete="current-password" /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="next" label="Nouveau mot de passe" hint="8 caractères, une lettre et un chiffre minimum."><Input name="next" type="password" autoComplete="new-password" /></Field>
        <Field name="confirm" label="Confirmer"><Input name="confirm" type="password" autoComplete="new-password" /></Field>
      </div>
      <SubmitButton variant="secondary" icon="lock">Changer le mot de passe</SubmitButton>
    </ActionForm>
  );
}

export function IncidentForm({ action, reference, types = ["complaint", "operational", "error", "technical", "security", "other"], withPriority = false }: {
  action: FormAction; reference?: string; types?: (keyof typeof incidentTypeLabel)[]; withPriority?: boolean;
}) {
  return (
    <ActionForm action={action} resetOnSuccess>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="type" label="Type"><Select name="type">{types.map((t) => <option key={t} value={t}>{incidentTypeLabel[t]}</option>)}</Select></Field>
        {withPriority ? (
          <Field name="priority" label="Urgence"><Select name="priority" defaultValue="medium"><option value="low">Basse</option><option value="medium">Moyenne</option><option value="high">Haute</option></Select></Field>
        ) : <input type="hidden" name="priority" value="medium" />}
        <Field name="transactionReference" label="Référence d'opération" optional><Input name="transactionReference" defaultValue={reference} className="font-mono" placeholder="FLM-DEP-…" /></Field>
      </div>
      <Field name="title" label="Objet"><Input name="title" maxLength={120} /></Field>
      <Field name="description" label="Description"><Textarea name="description" maxLength={2000} /></Field>
      <SubmitButton icon="megaphone">Envoyer le signalement</SubmitButton>
    </ActionForm>
  );
}
