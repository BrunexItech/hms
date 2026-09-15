"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { AppShell, NavItem } from "@/components/shell/app-shell";
import { FullPageSpinner } from "@/components/ui/spinner";
import { TenantSessionProvider, useTenantSession } from "@/lib/use-tenant-session";
import { resolveIcon } from "@/lib/icon-map";
import { clearTokens } from "@/lib/auth-storage";

const MODULE_ROUTES: Record<string, string> = {
  complaints: "/portal/complaints",
  visitor_booking: "/portal/visitors",
  utilities: "/portal/utilities",
};

function PortalChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { tenant, modules, loading } = useTenantSession();

  if (loading || !tenant) return <FullPageSpinner />;

  const navItems: NavItem[] = [
    { href: "/portal", label: "Overview", icon: LayoutDashboard },
    ...modules
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
      onLogout={() => {
        clearTokens("tenant");
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
