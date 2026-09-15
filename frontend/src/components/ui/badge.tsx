import { HTMLAttributes } from "react";
import clsx from "clsx";

type Tone = "neutral" | "success" | "warning" | "danger" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border border-border",
  success: "bg-success-bg text-success border border-success/20",
  warning: "bg-warning-bg text-warning border border-warning/20",
  danger: "bg-danger-bg text-danger border border-danger/20",
  primary: "bg-primary/10 text-primary border border-primary/20",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
