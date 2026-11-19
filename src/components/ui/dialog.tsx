"use client";
import { useRef, type ReactNode } from "react";
import { Button } from "./button";
import type { IconName } from "./icons";

/**
 * Bouton avec dialogue de confirmation natif (<dialog>), pour les actions sensibles.
 * Le contenu `children` (champs de formulaire éventuels) est placé dans le dialogue,
 * et le bouton « Confirmer » soumet le formulaire parent via l'attribut form.
 */
export function ConfirmDialog({ trigger, title, description, confirmLabel = "Confirmer", tone = "primary", formId, children, icon, triggerVariant = "secondary", name, value }: {
  trigger: ReactNode; title: string; description?: ReactNode; confirmLabel?: string; tone?: "primary" | "danger";
  formId: string; children?: ReactNode; icon?: IconName; triggerVariant?: "primary" | "secondary" | "danger" | "ghost" | "accent"; name?: string; value?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <Button type="button" variant={triggerVariant} icon={icon} size="sm" onClick={() => ref.current?.showModal()}>{trigger}</Button>
      <dialog ref={ref} className="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-raised)]">
        <div className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description && <div className="text-sm text-muted">{description}</div>}
          {children}
        </div>
        <div className="flex justify-end gap-2 border-t border-line bg-canvas px-5 py-3">
          <Button type="button" variant="ghost" onClick={() => ref.current?.close()}>Annuler</Button>
          <Button type="submit" form={formId} variant={tone} name={name} value={value} onClick={() => setTimeout(() => ref.current?.close(), 0)}>{confirmLabel}</Button>
        </div>
      </dialog>
    </>
  );
}
