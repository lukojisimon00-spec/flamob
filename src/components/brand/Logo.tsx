/**
 * Système de logo FLAMOB (concept v1 — à affiner avant usage imprimé).
 * Symbole : « F » géométrique — barre supérieure et fût en éclair (rapidité),
 * barre médiane cyan (mouvement), ondes de signal (mobile / connectivité).
 */
type Tone = "color" | "onDark" | "mono";

const TONES: Record<Tone, { primary: string; accent: string }> = {
  color: { primary: "var(--color-navy)", accent: "var(--color-cyan)" },
  onDark: { primary: "#FFFFFF", accent: "var(--color-cyan)" },
  mono: { primary: "currentColor", accent: "currentColor" },
};

export function LogoMark({ tone = "color", size = 32, signal = true, className }: { tone?: Tone; size?: number; signal?: boolean; className?: string }) {
  const c = TONES[tone];
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" focusable="false">
      <path fill={c.primary} d="M19 9H51L44.5 21H26L23 27H31L12 58L17 34H9Z" />
      <path fill={c.accent} d="M34 27H53L46.5 38.5H27.6Z" />
      <path fill={c.accent} d="M28.5 42H41.5L21 60Z" />
      {signal && (
        <g fill="none" stroke={c.accent} strokeWidth="3.6" strokeLinecap="round">
          <path d="M52 8A5 5 0 0 1 57 13" />
          <path d="M52.5 2A10.5 10.5 0 0 1 63 12.5" />
        </g>
      )}
    </svg>
  );
}

export function Wordmark({ tone = "color", className = "" }: { tone?: Tone; className?: string }) {
  const first = tone === "onDark" ? "text-white" : tone === "mono" ? "" : "text-navy";
  const second = tone === "mono" ? "" : "text-cyan";
  return (
    <span className={`font-extrabold tracking-[-0.02em] leading-none ${className}`}>
      <span className={first}>FLA</span>
      <span className={second}>MOB</span>
    </span>
  );
}

export function Logo({ tone = "color", size = 32, className = "" }: { tone?: Tone; size?: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="FLAMOB">
      <LogoMark tone={tone} size={size} />
      <Wordmark tone={tone} className="text-[1.35em]" />
    </span>
  );
}
