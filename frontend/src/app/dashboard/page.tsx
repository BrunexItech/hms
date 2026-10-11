"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, UserPlus, Banknote, ArrowRight } from "lucide-react";
import { BarTrendChart } from "@/components/ui/bar-trend-chart";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getDashboardSummary, listProperties, listStaffRentInvoices, listStaffComplaints } from "@/lib/endpoints";
import { DashboardSummary, RentInvoice, Complaint } from "@/lib/types";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";
import { FadeIn, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";

interface StatCard {
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  tone?: "default" | "warning" | "danger";
  format?: "number" | "currency";
}

interface AttentionItem {
  id: string;
  initials: string;
  name: string;
  sub: string;
  badge: string;
  tone: "warning" | "danger";
  href: string;
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [heroPhoto, setHeroPhoto] = useState<string | null>(null);
  const [overdueInvoices, setOverdueInvoices] = useState<RentInvoice[]>([]);
  const [openComplaints, setOpenComplaints] = useState<Complaint[]>([]);
  const brand = useBrand();

  useEffect(() => {
    getDashboardSummary().then((s) => {
      setSummary(s);
      if (s.rent_enabled) {
        listStaffRentInvoices()
          .then((invoices) => setOverdueInvoices(invoices.filter((i) => i.status === "overdue")))
          .catch(() => setOverdueInvoices([]));
      }
      if (s.complaints_enabled) {
        listStaffComplaints()
          .then((complaints) => setOpenComplaints(complaints.filter((c) => c.status === "open" || c.status === "in_progress")))
          .catch(() => setOpenComplaints([]));
      }
    });
    listProperties()
      .then((props) => setHeroPhoto(props.find((p) => p.photo_url)?.photo_url ?? null))
      .catch(() => setHeroPhoto(null));
  }, []);

  if (!summary) return <FullPageSpinner />;

  const heroSubtitle = summary.properties_enabled
    ? `${summary.total_properties ?? 0} propert${(summary.total_properties ?? 0) === 1 ? "y" : "ies"} · ${summary.occupancy_rate ?? 0}% occupied`
    : "Welcome back";

  const stats: StatCard[] = [
    ...(summary.properties_enabled
      ? [{ label: "Properties", value: summary.total_properties ?? 0, hint: `${summary.total_units ?? 0} units total` }]
      : []),
    ...(summary.properties_enabled
      ? [{ label: "Occupancy", value: summary.occupancy_rate ?? 0, suffix: "%", hint: `${summary.occupied_units ?? 0}/${summary.total_units ?? 0} occupied` }]
      : []),
    ...(summary.rent_enabled
      ? [
          {
            label: "Rent collected",
            value: summary.rent_collected_this_month ?? 0,
            format: "currency" as const,
            hint: `of ${(summary.rent_due_this_month ?? 0).toLocaleString()} due`,
          },
        ]
      : []),
    ...(summary.rent_enabled
      ? [
          {
            label: "Rent outstanding",
            value: summary.rent_outstanding ?? 0,
            format: "currency" as const,
            tone: "danger" as const,
            hint: overdueInvoices.length ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"}` : undefined,
          },
        ]
      : []),
    ...(summary.tenants_enabled ? [{ label: "Active residents", value: summary.active_tenants ?? 0 }] : []),
    ...(summary.utilities_enabled
      ? [{ label: "Utilities outstanding", value: summary.utilities_outstanding ?? 0, format: "currency" as const, tone: "warning" as const }]
      : []),
    ...(summary.complaints_enabled
      ? [{ label: "Open complaints", value: summary.open_complaints ?? 0, tone: (summary.open_complaints ?? 0) > 0 ? ("warning" as const) : ("default" as const) }]
      : []),
    ...(summary.visitor_booking_enabled ? [{ label: "Pending visitors", value: summary.pending_visitors ?? 0 }] : []),
  ];

  const toneColor = { default: "var(--foreground)", warning: "var(--warning)", danger: "var(--danger)" };
  const toneBadgeClass = { danger: "bg-danger-bg text-danger", warning: "bg-warning-bg text-warning" };

  const attention: AttentionItem[] = [
    ...overdueInvoices.map((inv) => ({
      id: `inv-${inv.id}`,
      initials: initialsOf(inv.tenant_name),
      name: inv.tenant_name,
      sub: `${inv.property_name} · ${inv.unit_name}`,
      badge: "Overdue",
      tone: "danger" as const,
      href: "/dashboard/rent",
    })),
    ...openComplaints.map((c) => ({
      id: `cx-${c.id}`,
      initials: initialsOf(c.tenant_name ?? c.subject),
      name: c.tenant_name ?? c.subject,
      sub: c.tenant_name ? c.subject : (c.unit_name ?? "General"),
      badge: c.status === "open" ? "Open" : "In progress",
      tone: "warning" as const,
      href: "/dashboard/complaints",
    })),
  ].slice(0, 6);

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
          <div className="mb-7 flex flex-wrap gap-2.5">
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

      {/* Real stat cards — bordered boxes, mono figures, no icon badges */}
      {stats.length > 0 && (
        <StaggerList className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((s) => (
            <StaggerItem key={s.label}>
              <div className="premium-card h-full px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{s.label}</p>
                <p className="mt-2 font-mono text-[24px] font-bold leading-none tracking-tight" style={{ color: toneColor[s.tone ?? "default"] }}>
                  {s.format === "currency" ? (
                    <CountUp value={Math.round(s.value)} duration={0.8} />
                  ) : (
                    <CountUp value={Math.round(s.value)} suffix={s.suffix ?? ""} duration={0.8} />
                  )}
                </p>
                {s.hint && <p className="mt-1.5 text-[11.5px] text-muted">{s.hint}</p>}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Two-column body: revenue chart + a real, data-driven attention list */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {summary.rent_enabled && summary.monthly_revenue && (
          <FadeIn>
            <div className="premium-card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-success">Revenue</p>
                  <h3 className="font-display text-base font-semibold text-foreground">Rent collected, last 6 months</h3>
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

        {(summary.rent_enabled || summary.complaints_enabled) && (
          <FadeIn delay={0.05}>
            <div className="premium-card overflow-hidden">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Needs attention</p>
                <h3 className="font-display text-base font-semibold text-foreground">Overdue rent &amp; open complaints</h3>
              </div>
              <div className="px-5">
                {attention.length === 0 ? (
                  <p className="py-8 text-center text-[13px] text-muted">Nothing needs attention right now.</p>
                ) : (
                  attention.map((item, i) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="flex items-center justify-between gap-3 py-3 transition-opacity hover:opacity-70"
                      style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-[12px] font-bold text-foreground">
                          {item.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-semibold text-foreground">{item.name}</p>
                          <p className="truncate text-[11.5px] text-muted">{item.sub}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide ${toneBadgeClass[item.tone]}`}>
                        {item.badge}
                      </span>
                    </Link>
                  ))
                )}
              </div>
              <div className="h-2" />
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
