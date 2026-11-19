"use client";
import { createContext, useActionState, useContext, useEffect, useRef, startTransition, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { FormAction, FormState } from "@/lib/forms";
import { Alert } from "./feedback";
import { Button } from "./button";
import type { IconName } from "./icons";

const Ctx = createContext<{ state: FormState; pending: boolean }>({ state: {}, pending: false });
export const useFormCtx = () => useContext(Ctx);

/**
 * Formulaire lié à une action serveur. Les valeurs saisies sont conservées en cas d'erreur
 * (pas de réinitialisation automatique), les erreurs par champ sont affichées sous chaque champ.
 */
export function ActionForm({ action, children, className = "space-y-4", resetOnSuccess = false, onSuccess, id }: {
  action: FormAction; children: ReactNode; className?: string; resetOnSuccess?: boolean; onSuccess?: (s: FormState) => void; id?: string;
}) {
  const [state, run, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      if (resetOnSuccess) ref.current?.reset();
      onSuccess?.(state);
    }
  }, [state, resetOnSuccess, onSuccess]);
  return (
    <Ctx.Provider value={{ state, pending }}>
      <form
        id={id}
        ref={ref}
        noValidate
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
          startTransition(() => run(fd));
        }}
      >
        {state.error && <Alert tone="danger">{state.error}</Alert>}
        {state.ok && state.message && <Alert tone="success">{state.message}</Alert>}
        {children}
      </form>
    </Ctx.Provider>
  );
}

export function Field({ name, label, hint, children, optional }: { name: string; label: ReactNode; hint?: ReactNode; children: ReactNode; optional?: boolean }) {
  const { state } = useFormCtx();
  const error = state.fieldErrors?.[name];
  return (
    <div className="space-y-1.5" data-invalid={error ? "" : undefined}>
      <label htmlFor={name} className="flex items-baseline justify-between text-sm font-semibold text-ink">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-muted">Facultatif</span>}
      </label>
      {children}
      {error ? <p className="text-sm font-medium text-danger" role="alert">{error}</p> : hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const control = "block w-full rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink placeholder:text-muted/70 focus:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan/30 disabled:bg-canvas in-data-invalid:border-danger";

export function Input({ className = "", ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input id={p.name} className={`${control} h-11 ${className}`} {...p} />;
}
export function Select({ className = "", children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select id={p.name} className={`${control} h-11 pr-8 ${className}`} {...p}>{children}</select>;
}
export function Textarea({ className = "", ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea id={p.name} className={`${control} py-2.5 min-h-24 ${className}`} {...p} />;
}
export function Checkbox({ label, ...p }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const { state } = useFormCtx();
  const error = p.name ? state.fieldErrors?.[p.name] : undefined;
  return (
    <div>
      <label className="flex items-start gap-3 text-sm text-ink-soft">
        <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-[var(--color-navy)]" {...p} />
        <span>{label}</span>
      </label>
      {error && <p className="mt-1 text-sm font-medium text-danger" role="alert">{error}</p>}
    </div>
  );
}

export function SubmitButton({ children, variant = "primary", block, icon, name, value, size }: { children: ReactNode; variant?: "primary" | "accent" | "secondary" | "danger" | "ghost"; block?: boolean; icon?: IconName; name?: string; value?: string; size?: "sm" | "md" | "lg" }) {
  const { pending } = useFormCtx();
  return (
    <Button type="submit" variant={variant} block={block} icon={icon} disabled={pending} name={name} value={value} size={size} aria-busy={pending}>
      {pending ? "Traitement…" : children}
    </Button>
  );
}
