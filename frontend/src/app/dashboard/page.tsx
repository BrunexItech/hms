"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Wallet, AlertTriangle, MessageSquareWarning, ScanLine, Receipt } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { BarTrendChart } from "@/components/ui/bar-trend-chart";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getDashboardSummary, listProperties } from "@/lib/endpoints";
import { DashboardSummary } from "@/lib/types";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";

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
      {brand && heroPhoto ? (
        <div className="relative mb-5 h-64 w-full overflow-hidden rounded-2xl shadow-lg sm:h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveImageUrl(heroPhoto) ?? undefined} alt={brand.name} className="h-full w-full object-cover" />
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
      <h1 className="mb-4 text-[15px] font-semibold text-foreground">Overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summary.properties_enabled && (
          <StatCard
            label="Occupancy"
            value={`${summary.occupancy_rate}%`}
            hint={`${summary.occupied_units}/${summary.total_units} units occupied`}
            icon={Building2}
            tone="primary"
          />
        )}
        {summary.tenants_enabled && (
          <StatCard label="Active residents" value={summary.active_tenants ?? 0} icon={Users} tone="success" />
        )}
        {summary.rent_enabled && (
          <StatCard
            label="Rent collected this month"
            value={(summary.rent_collected_this_month ?? 0).toLocaleString()}
            hint={`of ${(summary.rent_due_this_month ?? 0).toLocaleString()} due`}
            icon={Wallet}
            tone="success"
          />
        )}
        {summary.rent_enabled && (
          <StatCard
            label="Rent outstanding"
            value={(summary.rent_outstanding ?? 0).toLocaleString()}
            icon={AlertTriangle}
            tone="warning"
          />
        )}
        {summary.complaints_enabled && (
          <StatCard label="Open complaints" value={summary.open_complaints ?? 0} icon={MessageSquareWarning} tone="warning" />
        )}
        {summary.visitor_booking_enabled && (
          <StatCard label="Pending visitors" value={summary.pending_visitors ?? 0} icon={ScanLine} tone="info" />
        )}
        {summary.utilities_enabled && (
          <StatCard
            label="Utilities outstanding"
            value={(summary.utilities_outstanding ?? 0).toLocaleString()}
            icon={Receipt}
            tone="warning"
          />
        )}
      </div>

      {summary.rent_enabled && summary.monthly_revenue && (
        <Card className="mt-4">
          <BarTrendChart data={summary.monthly_revenue} />
        </Card>
      )}
    </div>
  );
}
