"use client";

import { useEffect, useState } from "react";
import { Building2, Users, MessageSquareWarning, ScanLine, Sparkles } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { FullPageSpinner } from "@/components/ui/spinner";
import { listProperties, listTenancies, listStaffComplaints, listStaffVisitorBookings } from "@/lib/endpoints";
import { useStaffSession } from "@/lib/use-staff-session";

interface Stats {
  properties: number;
  activeTenants: number;
  openComplaints: number;
  pendingVisitors: number;
}

export default function DashboardOverview() {
  const { staff, modules } = useStaffSession();
  const [stats, setStats] = useState<Stats | null>(null);

  const hasModule = (key: string) => modules.some((m) => m.key === key && m.enabled);

  useEffect(() => {
    if (modules.length === 0) return;
    async function load() {
      const [properties, tenancies, complaints, visitors] = await Promise.all([
        hasModule("properties") ? listProperties() : Promise.resolve([]),
        hasModule("tenants") ? listTenancies() : Promise.resolve([]),
        hasModule("complaints") ? listStaffComplaints() : Promise.resolve([]),
        hasModule("visitor_booking") ? listStaffVisitorBookings() : Promise.resolve([]),
      ]);
      setStats({
        properties: properties.length,
        activeTenants: tenancies.filter((t) => t.status === "active").length,
        openComplaints: complaints.filter((c) => c.status === "open" || c.status === "in_progress").length,
        pendingVisitors: visitors.filter((v) => v.status === "pending").length,
      });
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

  if (!stats) return <FullPageSpinner />;

  return (
    <div>
      <div className="ambient-bg premium-card mb-6 flex flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
        <div>
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3" /> Portfolio overview
          </span>
          <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
            Welcome back{staff ? `, ${staff.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted">Here&apos;s what&apos;s happening across your portfolio today.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={stats.properties} icon={Building2} tone="primary" />
        <StatCard label="Active residents" value={stats.activeTenants} icon={Users} tone="success" />
        <StatCard label="Open complaints" value={stats.openComplaints} icon={MessageSquareWarning} tone="warning" />
        <StatCard label="Pending visitors" value={stats.pendingVisitors} icon={ScanLine} tone="info" />
      </div>
    </div>
  );
}
