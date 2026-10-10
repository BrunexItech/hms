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

const toneGradient: Record<Tone, string> = {
  primary: "premium-gradient",
  success: "gradient-success",
  warning: "gradient-warning",
  danger: "gradient-danger",
  info: "gradient-info",
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
    <div className="premium-card premium-card-interactive relative overflow-hidden p-4 transition-transform duration-150 hover:-translate-y-0.5 sm:p-5">
      <div className={clsx("absolute inset-x-0 top-0 h-[3px]", toneGradient[tone])} />
      <Icon
        className={clsx("pointer-events-none absolute -right-3 -top-1 h-20 w-20 opacity-[0.07]", toneText[tone])}
        strokeWidth={1.5}
      />
      <div className="relative">
        <div className={clsx("mb-3 flex h-10 w-10 items-center justify-center rounded-xl", toneBg[tone], toneText[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="font-display text-[28px] font-bold leading-none tracking-tight text-foreground tabular-nums">
          {typeof value === "number" ? <CountUp value={value} duration={0.8} /> : value}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-muted">{label}</p>
        {hint && <p className="mt-0.5 text-[11.5px] leading-snug text-muted">{hint}</p>}
      </div>
    </div>
  );
}
