import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base = "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-control)] transition-colors disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-700",
  accent: "bg-cyan text-navy hover:bg-[#3cc6d5]",
  secondary: "bg-surface text-navy border border-line-strong hover:bg-navy-50",
  ghost: "text-navy hover:bg-navy-50",
  danger: "bg-danger text-white hover:bg-[#912018]",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[0.95rem]",
  lg: "h-12 px-5 text-base",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type Common = { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; block?: boolean; children?: ReactNode };

export function Button({ variant, size, icon, iconRight, block, className = "", children, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={buttonClass(variant, size, `${block ? "w-full" : ""} ${className}`)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </button>
  );
}

export function ButtonLink({ variant, size, icon, iconRight, block, className = "", children, ...rest }: Common & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass(variant, size, `${block ? "w-full" : ""} ${className}`)} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
      {iconRight && <Icon name={iconRight} size={18} />}
    </Link>
  );
}
