"use client";
/** Petits formulaires d'administration réutilisables (actions avec confirmation). */
import { ActionForm, Field, Input, SubmitButton, Textarea } from "@/components/ui/form";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { FormAction } from "@/lib/forms";
import type { ReactNode } from "react";

/** Action à confirmer, avec champs cachés et éventuel motif. */
export function ConfirmAction({ action, id, hidden, trigger, title, description, confirmLabel, tone = "primary", reasonName, reasonLabel = "Motif", triggerVariant }: {
  action: FormAction; id: string; hidden: Record<string, string>; trigger: ReactNode; title: string; description?: ReactNode;
  confirmLabel?: string; tone?: "primary" | "danger"; reasonName?: string; reasonLabel?: string; triggerVariant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
}) {
  return (
    <ActionForm action={action} id={id} className="space-y-2">
      {Object.entries(hidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <ConfirmDialog formId={id} trigger={trigger} title={title} description={description} confirmLabel={confirmLabel} tone={tone} triggerVariant={triggerVariant ?? (tone === "danger" ? "danger" : "secondary")}>
        {reasonName && <Field name={reasonName} label={reasonLabel}><Textarea name={reasonName} maxLength={600} className="min-h-20" /></Field>}
      </ConfirmDialog>
    </ActionForm>
  );
}

export function ResetDemoForm({ action }: { action: FormAction }) {
  return (
    <ActionForm action={action}>
      <Field name="confirm" label="Tapez REINITIALISER pour confirmer"><Input name="confirm" autoComplete="off" className="font-mono" /></Field>
      <SubmitButton variant="danger" icon="refresh">Réinitialiser les données de démonstration</SubmitButton>
    </ActionForm>
  );
}
