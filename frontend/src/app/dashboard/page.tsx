"use client";

import { useEffect, useState } from "react";
import { Building2, Users, Wallet, AlertTriangle, MessageSquareWarning, ScanLine, Receipt } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { BarTrendChart } from "@/components/ui/bar-trend-chart";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getDashboardSummary } from "@/lib/endpoints";
import { DashboardSummary } from "@/lib/types";
import { useBrand } from "@/lib/brand-context";
import { resolveImageUrl } from "@/lib/config";

export default function DashboardOverview() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const brand = useBrand();

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  if (!summary) return <FullPageSpinner />;

  return (
    <div>
      {brand && (
        <div
          className="mb-4 flex items-center gap-4 overflow-hidden rounded-2xl p-5 text-white shadow-sm"
          style={{ background: `linear-gradient(135deg, ${brand.color}, color-mix(in srgb, ${brand.color} 55%, black))` }}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur-sm">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImageUrl(brand.logoUrl) ?? undefined} alt={brand.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/70">Welcome back</p>
            <h2 className="truncate text-lg font-semibold">{brand.name}</h2>
          </div>
        </div>
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
