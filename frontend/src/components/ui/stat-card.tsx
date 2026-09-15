import { LucideIcon } from "lucide-react";
import clsx from "clsx";

type Tone = "primary" | "success" | "warning" | "danger" | "info";

const toneGradient: Record<Tone, string> = {
  primary: "premium-gradient",
  success: "gradient-success",
  warning: "gradient-warning",
  danger: "gradient-danger",
  info: "gradient-info",
};

const toneShadow: Record<Tone, string> = {
  primary: "shadow-[0_10px_24px_-8px_var(--primary)]",
  success: "shadow-[0_10px_24px_-8px_var(--success)]",
  warning: "shadow-[0_10px_24px_-8px_var(--warning)]",
  danger: "shadow-[0_10px_24px_-8px_var(--danger)]",
  info: "shadow-[0_10px_24px_-8px_var(--info)]",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: StatCardProps) {
  return (
    <div className="premium-card premium-card-interactive dot-grid relative overflow-hidden p-5">
      <div
        className={clsx(
          "absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] blur-xl",
          toneGradient[tone]
        )}
      />
      <div
        className={clsx(
          "relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-white",
          toneGradient[tone],
          toneShadow[tone]
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-sm text-muted">{label}</p>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}
