/** Kinshasa = UTC+1 sans heure d'été. Clé de jour locale pour les plafonds journaliers. */
const KINSHASA_OFFSET_MS = 60 * 60 * 1000;
export const dayKey = (d: Date | string) => new Date(new Date(d).getTime() + KINSHASA_OFFSET_MS).toISOString().slice(0, 10);
export const monthKey = (d: Date | string) => dayKey(d).slice(0, 7);
export const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60_000);
export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86_400_000);
