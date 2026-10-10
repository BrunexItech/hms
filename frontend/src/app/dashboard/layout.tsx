"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import { History, LayoutDashboard, Settings, Users2 } from "lucide-react";
import { AppShell, NavItem } from "@/components/shell/app-shell";
import { FullPageSpinner } from "@/components/ui/spinner";
import { StaffSessionProvider, useStaffSession } from "@/lib/use-staff-session";
import { resolveIcon } from "@/lib/icon-map";
import { getMyOrganization, staffLogout } from "@/lib/endpoints";
import { Organization } from "@/lib/types";
import { BrandProvider } from "@/lib/brand-context";

const fraunces = Fraunces({
  variable: "--font-dash-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
const manrope = Manrope({
  variable: "--font-dash-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-dash-mono",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

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
  const [org, setOrg] = useState<Organization | null>(null);

  useEffect(() => {
    if (staff) getMyOrganization().then(setOrg);
  }, [staff]);

  const refreshOrg = async () => {
    setOrg(await getMyOrganization());
  };

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
      brandName={org?.name ?? "HMS"}
      brandSubtitle={staff.role === "owner" ? "Owner" : "Property Manager"}
      brandLogoUrl={org?.logo_url}
      brandColor={org?.primary_color}
      userName={staff.full_name}
      userMeta={staff.email}
      onLogout={async () => {
        await staffLogout();
        router.replace("/login");
      }}
    >
      {org ? (
        <BrandProvider brand={{ name: org.name, logoUrl: org.logo_url, color: org.primary_color, refresh: refreshOrg }}>{children}</BrandProvider>
      ) : (
        children
      )}
    </AppShell>
  );
}

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className={`${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable} dash-theme min-h-screen`}>
      <StaffSessionProvider>
        <DashboardChrome>{children}</DashboardChrome>
      </StaffSessionProvider>
    </div>
  );
}
