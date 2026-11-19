const TZ = "Africa/Kinshasa";
const dt = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const d = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "2-digit", month: "short", year: "numeric" });
const t = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });

export const formatDateTime = (iso: string) => dt.format(new Date(iso));
export const formatDate = (iso: string) => d.format(new Date(iso));
export const formatTime = (iso: string) => t.format(new Date(iso));

export function relativeTime(iso: string, now = new Date()): string {
  const diff = (now.getTime() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 7 * 86400) return `il y a ${Math.floor(diff / 86400)} j`;
  return formatDate(iso);
}

export const sp = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
export const includesText = (hay: (string | undefined)[], q: string) => {
  const n = q.trim().toLowerCase();
  return !n || hay.some((h) => h?.toLowerCase().includes(n));
};
