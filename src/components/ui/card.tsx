import Link from "next/link";
import type { ReactNode } from "react";

export function Card({ children, className = "", as: As = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <As className={`bg-surface border border-line rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ${className}`}>{children}</As>;
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function CardLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="text-sm font-semibold text-cyan-700 hover:underline whitespace-nowrap">{children}</Link>;
}
