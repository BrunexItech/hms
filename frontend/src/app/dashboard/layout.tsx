"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { History, LayoutDashboard, Settings, Users2 } from "lucide-react";
import { AppShell, NavItem } from "@/components/shell/app-shell";
import { FullPageSpinner } from "@/components/ui/spinner";
import { StaffSessionProvider, useStaffSession } from "@/lib/use-staff-session";
import { resolveIcon } from "@/lib/icon-map";
import { staffLogout } from "@/lib/endpoints";

const MODULE_ROUTES: Record<string, string> = {
  properties: "/dashboard/properties",
  tenants: "/dashboard/tenants",
  rent: "/dashboard/rent",
  complaints: "/dashboard/complaints",
  visitor_booking: "/dashboard/visitors",
  utilities: "/dashboard/utilities",
};

const MODULE_ORDER = ["properties", "tenants", "rent", "utilities", "complaints", "visitor_booking"];
const byModuleOrder = (a: { key: string }, b: { key: string }) =>
  MODULE_ORDER.indexOf(a.key) - MODULE_ORDER.indexOf(b.key);

function DashboardChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { staff, modules, loading } = useStaffSession();

  if (loading || !staff) return <FullPageSpinner />;

  const navItems: NavItem[] = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ...[...modules].sort(byModuleOrder)
      .filter((m) => m.enabled && MODULE_ROUTES[m.key])
      .map((m) => ({ href: MODULE_ROUTES[m.key], label: m.name, icon: resolveIcon(m.icon) })),
    { href: "/dashboard/team", label: "Team", icon: Users2 },
    ...(staff.role === "owner" ? [{ href: "/dashboard/activity", label: "Activity", icon: History }] : []),
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ];

  return (
    <AppShell
      navItems={navItems}
      brandName="HMS"
      brandSubtitle={staff.role === "owner" ? "Owner" : "Property Manager"}
      userName={staff.full_name}
      userMeta={staff.email}
      onLogout={async () => {
        await staffLogout();
        router.replace("/login");
      }}
    >
      {children}
    </AppShell>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <StaffSessionProvider>
      <DashboardChrome>{children}</DashboardChrome>
    </StaffSessionProvider>
  );
}
