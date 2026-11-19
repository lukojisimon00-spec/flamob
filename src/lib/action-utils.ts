import { z } from "zod";
import { DomainError } from "./errors";
import type { FormState } from "./forms";

/** Convertit FormData en objet simple (les champs multiples deviennent des tableaux). */
export function formToObject(fd: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    const cur = out[k];
    if (cur === undefined) out[k] = v;
    else out[k] = Array.isArray(cur) ? [...cur, v] : [cur, v];
  }
  return out;
}

export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Valide puis exécute ; transforme les erreurs métier/validation en état de formulaire. */
export function parse<T extends z.ZodType>(schema: T, fd: FormData): { ok: true; data: z.infer<T> } | { ok: false; state: FormState } {
  const r = schema.safeParse(formToObject(fd));
  if (!r.success) return { ok: false, state: { error: "Merci de corriger les champs indiqués.", fieldErrors: zodFieldErrors(r.error) } };
  return { ok: true, data: r.data };
}

export function fail(err: unknown): FormState {
  if (err instanceof DomainError) return { error: err.message, fieldErrors: err.field ? { [err.field]: err.message } : undefined };
  console.error("[flamob] Erreur inattendue", err);
  return { error: "Une erreur inattendue s'est produite. Réessayez." };
}
