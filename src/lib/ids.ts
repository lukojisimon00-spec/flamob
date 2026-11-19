import crypto from "node:crypto";
import type { Database } from "./db/schema";
import { nextCounter } from "./db/counter";

export const newId = () => crypto.randomUUID();

/** Référence lisible : FLM-DEP-241119-0007 (préfixe, date, séquence). */
export function makeReference(db: Database, prefix: string, now: Date): string {
  const seq = nextCounter(db, prefix);
  const d = now.toISOString().slice(2, 10).replace(/-/g, "");
  return `FLM-${prefix}-${d}-${String(seq).padStart(4, "0")}`;
}

/** Masque un numéro de compte : •••• 4821 */
export function maskAccount(raw: string): string {
  const digits = raw.replace(/\s+/g, "");
  return `•••• ${digits.slice(-4)}`;
}
