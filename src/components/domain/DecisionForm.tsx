"use client";
import { ActionForm, Field, SubmitButton, Textarea } from "@/components/ui/form";
import type { FormAction } from "@/lib/forms";
import type { ApplicationStatus } from "@/lib/db/schema";

const labels: Partial<Record<ApplicationStatus, { label: string; variant: "primary" | "secondary" | "danger" }>> = {
  under_review: { label: "Passer en examen", variant: "secondary" },
  info_required: { label: "Demander des informations", variant: "secondary" },
  approved_sim: { label: "Approuver (simulation)", variant: "primary" },
  rejected_sim: { label: "Refuser (simulation)", variant: "danger" },
  completed: { label: "Terminer (créer un compte de démo)", variant: "primary" },
};

export function DecisionForm({ action, id, allowed }: { action: FormAction; id: string; allowed: ApplicationStatus[] }) {
  return (
    <ActionForm action={action} resetOnSuccess>
      <input type="hidden" name="id" value={id} />
      <Field name="comment" label="Commentaire" hint="Obligatoire pour une demande d'informations ou un refus. Visible par le client."><Textarea name="comment" maxLength={600} /></Field>
      <div className="flex flex-wrap gap-2">
        {allowed.map((s) => <SubmitButton key={s} name="to" value={s} variant={labels[s]?.variant ?? "secondary"}>{labels[s]?.label ?? s}</SubmitButton>)}
      </div>
    </ActionForm>
  );
}
