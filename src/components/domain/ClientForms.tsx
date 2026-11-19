"use client";
import { ActionForm, Field, SubmitButton, Textarea } from "@/components/ui/form";
import { DocumentPicker } from "./DocumentPicker";
import type { FormAction } from "@/lib/forms";

export function RespondInfoForm({ action, id }: { action: FormAction; id: string }) {
  return (
    <ActionForm action={action} resetOnSuccess>
      <input type="hidden" name="id" value={id} />
      <Field name="comment" label="Votre réponse"><Textarea name="comment" required maxLength={600} /></Field>
      <DocumentPicker kinds={["Document complémentaire", "Pièce d'identité", "Justificatif"]} />
      <SubmitButton icon="check">Envoyer ma réponse</SubmitButton>
    </ActionForm>
  );
}

export function DeleteDraftForm({ action, id }: { action: FormAction; id: string }) {
  return (
    <ActionForm action={action} className="">
      <input type="hidden" name="id" value={id} />
      <SubmitButton variant="ghost">Supprimer le brouillon</SubmitButton>
    </ActionForm>
  );
}
