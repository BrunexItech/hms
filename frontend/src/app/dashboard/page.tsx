"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  Wallet,
  AlertTriangle,
  MessageSquareWarning,
  ScanLine,
  Receipt,
  Plus,
  UserPlus,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { BarTrendChart } from "@/components/ui/bar-trend-chart";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getDashboardSummary, listProperties } from "@/lib/endpoints";
import { DashboardSummary } from "@/lib/types";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";

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
            className="mb-5 flex items-center gap-4 overflow-hidden rounded-2xl p-6 text-white shadow-md sm:p-7"
            style={{ background: `linear-gradient(135deg, ${brand.color}, color-mix(in srgb, ${brand.color} 55%, black))` }}
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
          <div className="mb-6 flex flex-wrap gap-2.5">
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

      {(summary.properties_enabled || summary.tenants_enabled) && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Portfolio</h2>
          <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.properties_enabled && (
              <StaggerItem>
                <StatCard
                  label="Occupancy"
                  value={`${summary.occupancy_rate}%`}
                  hint={`${summary.occupied_units}/${summary.total_units} units occupied`}
                  icon={Building2}
                  tone="primary"
                />
              </StaggerItem>
            )}
            {summary.tenants_enabled && (
              <StaggerItem>
                <StatCard label="Active residents" value={summary.active_tenants ?? 0} icon={Users} tone="success" />
              </StaggerItem>
            )}
          </StaggerList>
        </div>
      )}

      {(summary.rent_enabled || summary.utilities_enabled) && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Finance</h2>
          <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.rent_enabled && (
              <StaggerItem>
                <StatCard
                  label="Rent collected this month"
                  value={(summary.rent_collected_this_month ?? 0).toLocaleString()}
                  hint={`of ${(summary.rent_due_this_month ?? 0).toLocaleString()} due`}
                  icon={Wallet}
                  tone="success"
                />
              </StaggerItem>
            )}
            {summary.rent_enabled && (
              <StaggerItem>
                <StatCard
                  label="Rent outstanding"
                  value={(summary.rent_outstanding ?? 0).toLocaleString()}
                  icon={AlertTriangle}
                  tone="warning"
                />
              </StaggerItem>
            )}
            {summary.utilities_enabled && (
              <StaggerItem>
                <StatCard
                  label="Utilities outstanding"
                  value={(summary.utilities_outstanding ?? 0).toLocaleString()}
                  icon={Receipt}
                  tone="danger"
                />
              </StaggerItem>
            )}
          </StaggerList>
        </div>
      )}

      {(summary.complaints_enabled || summary.visitor_booking_enabled) && (
        <div className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Activity</h2>
          <StaggerList className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.complaints_enabled && (
              <StaggerItem>
                <StatCard label="Open complaints" value={summary.open_complaints ?? 0} icon={MessageSquareWarning} tone="warning" />
              </StaggerItem>
            )}
            {summary.visitor_booking_enabled && (
              <StaggerItem>
                <StatCard label="Pending visitors" value={summary.pending_visitors ?? 0} icon={ScanLine} tone="info" />
              </StaggerItem>
            )}
          </StaggerList>
        </div>
      )}

      {summary.rent_enabled && summary.monthly_revenue && (
        <FadeIn>
          <div className="premium-card mt-2 overflow-hidden">
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
