import { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { CountUp } from "@/components/ui/motion";

type Tone = "primary" | "success" | "warning" | "danger" | "info";

const toneText: Record<Tone, string> = {
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

const toneBg: Record<Tone, string> = {
  primary: "bg-primary/10",
  success: "bg-success/10",
  warning: "bg-warning/10",
  danger: "bg-danger/10",
  info: "bg-info/10",
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
    <div className="premium-card premium-card-interactive flex items-center gap-3 p-3 transition-transform duration-150 hover:-translate-y-0.5 sm:gap-3.5 sm:p-4">
      <div className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneBg[tone], toneText[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-bold leading-none tracking-tight text-foreground tabular-nums">
          {typeof value === "number" ? <CountUp value={value} duration={0.8} /> : value}
        </p>
        <p className="mt-1 text-[13px] leading-snug text-muted">{label}</p>
        {hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{hint}</p>}
      </div>
    </div>
  );
}
