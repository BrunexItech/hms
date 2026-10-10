import { ReactNode } from "react";
import clsx from "clsx";

export type AccentTone = "primary" | "info" | "success" | "warning" | "danger";

const toneVar: Record<AccentTone, string> = {
  primary: "var(--primary)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const toneText: Record<AccentTone, string> = {
  primary: "text-primary",
  info: "text-info",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

interface AccentCardProps {
  tone: AccentTone;
  title: string;
  description: string;
  eyebrow?: string;
  className?: string;
  interactive?: boolean;
  children?: ReactNode;
}

export function AccentCard({ tone, title, description, eyebrow, className, interactive = true, children }: AccentCardProps) {
  return (
    <div
      className={clsx(
        "premium-card h-full border-l-[3px] p-6",
        interactive && "premium-card-interactive",
        className
      )}
      style={{ borderLeftColor: toneVar[tone] }}
    >
      {eyebrow && <p className={clsx("mb-1.5 text-xs font-semibold uppercase tracking-wide", toneText[tone])}>{eyebrow}</p>}
      <h3 className="mb-1.5 text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted">{description}</p>
      {children}
    </div>
  );
}
