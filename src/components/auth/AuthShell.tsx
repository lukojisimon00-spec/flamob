import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/icons";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <aside className="relative hidden overflow-hidden bg-navy p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link href="/" aria-label="Accueil FLAMOB"><Logo tone="onDark" size={40} /></Link>
        <div className="max-w-md space-y-5">
          <p className="text-3xl font-bold leading-tight">Vos services financiers, plus proches.</p>
          <ul className="space-y-3 text-sm text-white/80">
            {["Découvrez des banques et comparez leurs offres", "Démarrez une demande d'ouverture de compte depuis votre téléphone", "Trouvez un agent Flamob près de chez vous"].map((t) => (
              <li key={t} className="flex gap-3"><Icon name="check" size={18} className="mt-0.5 shrink-0 text-cyan" />{t}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-white/60">Prototype de démonstration — banques fictives, opérations simulées. Flamob n'est pas une banque.</p>
        <svg aria-hidden="true" viewBox="0 0 200 200" className="pointer-events-none absolute -right-16 -top-10 w-80 text-cyan/15">
          <g fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round"><path d="M100 60a40 40 0 0 1 40 40" /><path d="M100 20a80 80 0 0 1 80 80" /></g>
        </svg>
      </aside>
      <main className="flex flex-col px-4 py-6 sm:px-8">
        <Link href="/" className="lg:hidden" aria-label="Accueil FLAMOB"><Logo size={30} /></Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
