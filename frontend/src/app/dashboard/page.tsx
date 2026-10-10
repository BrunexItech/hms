"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, UserPlus, Banknote, ArrowRight } from "lucide-react";
import { BarTrendChart } from "@/components/ui/bar-trend-chart";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getDashboardSummary, listProperties } from "@/lib/endpoints";
import { DashboardSummary } from "@/lib/types";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";
import { FadeIn, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
  format?: "number" | "currency";
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const brand = useBrand();

  useEffect(() => {
    getDashboardSummary().then(setSummary);
    listProperties()
      .then((props) => setHeroPhoto(props.find((p) => p.photo_url)?.photo_url ?? null))
      .catch(() => setHeroPhoto(null));
  }, []);

  if (!summary) return <FullPageSpinner />;

  const heroSubtitle = summary.properties_enabled
    ? `${summary.total_properties ?? 0} propert${(summary.total_properties ?? 0) === 1 ? "y" : "ies"} · ${summary.occupancy_rate ?? 0}% occupied`
    : "Welcome back";

  // The one number that answers "how am I doing" — rent collected is the
  // most meaningful single figure for a landlord when it's on; otherwise
  // occupancy stands in as the verdict.
  const verdict = summary.rent_enabled
    ? {
        label: "Rent collected this month",
        value: summary.rent_collected_this_month ?? 0,
        format: "currency" as const,
        detail: `of ${(summary.rent_due_this_month ?? 0).toLocaleString()} due · ${
          summary.rent_due_this_month ? Math.round(((summary.rent_collected_this_month ?? 0) / summary.rent_due_this_month) * 100) : 0
        }% collection rate`,
      }
    : summary.properties_enabled
      ? {
          label: "Occupancy",
          value: summary.occupancy_rate ?? 0,
          format: "number" as const,
          detail: `${summary.occupied_units ?? 0} of ${summary.total_units ?? 0} units occupied`,
        }
      : null;

  const metrics: Metric[] = [
    ...(summary.properties_enabled
      ? [{ label: "Occupancy", value: summary.occupancy_rate ?? 0, suffix: "%", hint: `${summary.occupied_units}/${summary.total_units} units` }]
      : []),
    ...(summary.tenants_enabled ? [{ label: "Active residents", value: summary.active_tenants ?? 0 }] : []),
    ...(summary.rent_enabled
      ? [{ label: "Rent outstanding", value: summary.rent_outstanding ?? 0, format: "currency" as const, tone: "danger" as const }]
      : []),
    ...(summary.utilities_enabled
      ? [{ label: "Utilities outstanding", value: summary.utilities_outstanding ?? 0, format: "currency" as const, tone: "warning" as const }]
      : []),
    ...(summary.complaints_enabled
      ? [{ label: "Open complaints", value: summary.open_complaints ?? 0, tone: (summary.open_complaints ?? 0) > 0 ? ("warning" as const) : ("default" as const) }]
      : []),
    ...(summary.visitor_booking_enabled ? [{ label: "Pending visitors", value: summary.pending_visitors ?? 0 }] : []),
  ];

  const toneColor = { default: "var(--foreground)", warning: "var(--warning)", danger: "var(--danger)" };

  return (
    <div>
      <FadeIn>
        {brand && heroPhoto ? (
          <div className="relative mb-5 h-64 w-full overflow-hidden rounded-2xl shadow-lg sm:h-80">
            <ProgressiveImage
              src={resolveImageUrl(heroPhoto) ?? ""}
              alt={brand.name}
              className="h-full w-full"
              imgClassName="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-4 p-6 sm:p-8">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-white shadow-lg ring-2 ring-white/80 sm:h-[72px] sm:w-[72px]"
                style={{ background: brand.color }}
              >
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImageUrl(brand.logoUrl) ?? undefined} alt={brand.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display truncate text-2xl font-bold text-white sm:text-3xl">{brand.name}</h2>
                <p className="mt-0.5 text-[13px] font-medium text-white/85 sm:text-sm">{heroSubtitle}</p>
              </div>
            </div>
          </div>
        ) : (
          brand && (
            <div
              className="relative mb-5 flex items-center gap-4 overflow-hidden rounded-2xl p-6 text-white shadow-md sm:p-7"
              style={{
                backgroundImage: `linear-gradient(135deg, ${brand.color}, color-mix(in srgb, ${brand.color} 55%, black)), linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                backgroundSize: "auto, 34px 34px, 34px 34px",
              }}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 shadow-inner backdrop-blur-sm sm:h-16 sm:w-16">
                {brand.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImageUrl(brand.logoUrl) ?? undefined} alt={brand.name} className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-7 w-7" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="font-display truncate text-xl font-bold sm:text-2xl">{brand.name}</h2>
                <p className="mt-0.5 text-[13px] font-medium text-white/80">{heroSubtitle}</p>
              </div>
            </div>
          )
        )}
      </FadeIn>

      {(summary.properties_enabled || summary.tenants_enabled || summary.rent_enabled) && (
        <FadeIn delay={0.05}>
          <div className="mb-8 flex flex-wrap gap-2.5">
            {summary.properties_enabled && (
              <Link
                href="/dashboard/properties"
                className="inline-flex h-10 items-center gap-2 rounded-xl premium-gradient px-4 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
              >
                <Plus className="h-4 w-4" /> Add property
              </Link>
            )}
            {summary.properties_enabled && (
              <Link
                href="/dashboard/properties"
                className="premium-card inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                <UserPlus className="h-4 w-4 text-info" /> Register tenant
              </Link>
            )}
            {summary.rent_enabled && (
              <Link
                href="/dashboard/rent"
                className="premium-card inline-flex h-10 items-center gap-2 px-4 text-[13px] font-semibold text-foreground transition-colors hover:bg-surface-2"
              >
                <Banknote className="h-4 w-4 text-success" /> Record payment
              </Link>
            )}
          </div>
        </FadeIn>
      )}

      {/* The verdict: one confident number, not a card */}
      {verdict && (
        <FadeIn delay={0.08}>
          <div className="mb-8">
            <p className="mb-2 text-[13px] font-medium uppercase tracking-wide text-muted">{verdict.label}</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="font-mono text-[56px] font-bold leading-none tracking-tight text-foreground sm:text-[72px]">
                {verdict.format === "currency" ? (
                  <CountUp value={Math.round(verdict.value)} prefix="" duration={1} />
                ) : (
                  <CountUp value={Math.round(verdict.value)} suffix="%" duration={1} />
                )}
              </p>
              <p className="pb-2 text-[14px] text-muted">{verdict.detail}</p>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Secondary metrics: a hairline-divided row, no boxes, no icons */}
      {metrics.length > 0 && (
        <StaggerList className="mb-10 flex flex-wrap border-y border-border">
          {metrics.map((m, i) => (
            <StaggerItem key={m.label}>
              <div
                className="min-w-[160px] flex-1 px-5 py-5 first:pl-0"
                style={{ borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}
              >
                <p className="mb-1.5 text-[12.5px] text-muted">{m.label}</p>
                <p className="font-mono text-[26px] font-bold leading-none tracking-tight" style={{ color: toneColor[m.tone ?? "default"] }}>
                  <CountUp value={m.value} suffix={m.suffix ?? ""} duration={0.8} />
                </p>
                {m.hint && <p className="mt-1 text-[11.5px] text-muted">{m.hint}</p>}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {summary.rent_enabled && summary.monthly_revenue && (
        <FadeIn>
          <div className="premium-card overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-success">Revenue</p>
                <h3 className="text-base font-semibold text-foreground">Rent collected, last 6 months</h3>
              </div>
              <Link
                href="/dashboard/rent"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary transition-opacity hover:opacity-80"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="p-5">
              <BarTrendChart data={summary.monthly_revenue} />
            </div>
          </div>
        </FadeIn>
      )}
    </div>
  );
}
