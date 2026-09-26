"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { AppShell, NavItem } from "@/components/shell/app-shell";
import { FullPageSpinner } from "@/components/ui/spinner";
import { TenantSessionProvider, useTenantSession } from "@/lib/use-tenant-session";
import { resolveIcon } from "@/lib/icon-map";
import { tenantLogout } from "@/lib/endpoints";

const MODULE_ROUTES: Record<string, string> = {
  rent: "/portal/rent",
  complaints: "/portal/complaints",
  visitor_booking: "/portal/visitors",
  utilities: "/portal/utilities",
};

const MODULE_ORDER = ["properties", "tenants", "rent", "utilities", "complaints", "visitor_booking"];
const byModuleOrder = (a: { key: string }, b: { key: string }) =>
  MODULE_ORDER.indexOf(a.key) - MODULE_ORDER.indexOf(b.key);

function PortalChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tenant, modules, loading } = useTenantSession();

  if (loading || !tenant) return <FullPageSpinner />;

  const navItems: NavItem[] = [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    ...[...modules].sort(byModuleOrder)
      .filter((m) => MODULE_ROUTES[m.key])
      .map((m) => ({ href: MODULE_ROUTES[m.key], label: m.name, icon: resolveIcon(m.icon) })),
  ];

  return (
    <AppShell
      navItems={navItems}
      brandName={tenant.organization_name}
      brandSubtitle={`${tenant.property_name} · Unit ${tenant.unit_name}`}
      userName={tenant.full_name}
      userMeta={tenant.email}
      onLogout={async () => {
        await tenantLogout();
        router.replace("/access");
      }}
    >
      {children}
    </AppShell>
  );
}

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <TenantSessionProvider>
      <PortalChrome>{children}</PortalChrome>
    </TenantSessionProvider>
  );
}
