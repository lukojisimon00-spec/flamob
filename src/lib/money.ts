import type { Currency } from "./db/schema";

/** Montants stockés en unités mineures (×100). */
export const toMinor = (major: number) => Math.round(major * 100);
export const toMajor = (minor: number) => minor / 100;

const formatters: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  CDF: new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
};

/** Ex. « 1 250,00 $ » ou « 85 000 FC ». */
export function formatMoney(minor: number, currency: Currency): string {
  const value = formatters[currency].format(toMajor(minor)).replace(/ | /g, " ");
  return currency === "USD" ? `${value} $` : `${value} FC`;
}

/** Pourcentage exprimé en points de base → « 1,5 % ». */
export function formatBp(bp: number): string {
  return `${(bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

/** Calcule fixe + variable, borné entre min et max. */
export function computeRate(amount: number, percentBp: number, fixed: number, min: number, max: number | null): number {
  let v = fixed + Math.round((amount * percentBp) / 10000);
  if (v < min) v = min;
  if (max !== null && v > max) v = max;
  return v;
}
