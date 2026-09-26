"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, ShieldCheck } from "lucide-react";
import { AppShell, NavItem } from "@/components/shell/app-shell";
import { FullPageSpinner } from "@/components/ui/spinner";
import { StaffSessionProvider, useStaffSession } from "@/lib/use-staff-session";
import { staffLogout } from "@/lib/endpoints";

const navItems: NavItem[] = [
  { href: "/admin", label: "Organizations", icon: Building2 },
  { href: "/admin/account", label: "Account", icon: KeyRound },
];

function SuperAdminChrome({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { staff, loading } = useStaffSession();

  useEffect(() => {
    if (!loading && staff && staff.role !== "super_admin") {
      router.replace("/dashboard");
    }
  }, [loading, staff, router]);

  if (loading || !staff || staff.role !== "super_admin") return <FullPageSpinner />;

  return (
    <AppShell
      navItems={navItems}
      brandName="HMS"
      brandSubtitle="Platform Control Room"
      userName={staff.full_name}
      userMeta={staff.email}
      onLogout={async () => {
        await staffLogout();
        router.replace("/admin/login");
      }}
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm text-primary">
        <ShieldCheck className="h-4 w-4" /> Super admin — changes here affect every business on the platform.
      </div>
      {children}
    </AppShell>
  );
}

export default function SuperAdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <StaffSessionProvider loginPath="/admin/login">
      <SuperAdminChrome>{children}</SuperAdminChrome>
    </StaffSessionProvider>
  );
}
