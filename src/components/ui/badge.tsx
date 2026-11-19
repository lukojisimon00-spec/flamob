import type { ReactNode } from "react";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-canvas text-ink-soft ring-line-strong",
  info: "bg-info-bg text-info ring-navy-700/20",
  success: "bg-success-bg text-success ring-success/20",
  warning: "bg-warning-bg text-warning ring-warning/25",
  danger: "bg-danger-bg text-danger ring-danger/20",
  brand: "bg-cyan-50 text-cyan-700 ring-cyan-700/20",
};

export function Badge({ tone = "neutral", children, dot = true }: { tone?: Tone; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap ${tones[tone]}`}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}

/** Étiquette « Simulé » / « Fictif » : toujours visible à côté d'une donnée non réelle. */
export function SimTag({ children = "Simulé" }: { children?: ReactNode }) {
  return <span className="inline-flex items-center rounded-md border border-dashed border-cyan-700/40 bg-cyan-50 px-1.5 py-px font-mono text-[0.68rem] font-medium uppercase tracking-wide text-cyan-700">{children}</span>;
}
