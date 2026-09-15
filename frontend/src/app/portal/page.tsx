"use client";

import { Home, MessageSquareWarning, ScanLine, Receipt, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTenantSession } from "@/lib/use-tenant-session";
import Link from "next/link";

const TONES = {
  complaints: "gradient-warning",
  visitor_booking: "gradient-info",
  utilities: "gradient-success",
};

export default function PortalOverview() {
  const { tenant, modules } = useTenantSession();

  const quickLinks = [
    { key: "complaints", label: "Raise a complaint", href: "/portal/complaints", icon: MessageSquareWarning },
    { key: "visitor_booking", label: "Book a visitor", href: "/portal/visitors", icon: ScanLine },
    { key: "utilities", label: "View utility bills", href: "/portal/utilities", icon: Receipt },
  ].filter((l) => modules.some((m) => m.key === l.key));

  return (
    <div>
      <div className="ambient-bg premium-card mb-6 flex items-center gap-4 p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl premium-gradient text-white shadow-lg">
          <Home className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Welcome, {tenant?.full_name.split(" ")[0]}</h1>
          <p className="text-sm text-muted">
            {tenant?.property_name} · Unit {tenant?.unit_name}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((l) => (
          <Link key={l.key} href={l.href}>
            <Card interactive className="flex h-full items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white ${TONES[l.key as keyof typeof TONES]}`}>
                <l.icon className="h-5 w-5" />
              </div>
              <p className="flex-1 font-medium text-foreground">{l.label}</p>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>
        ))}
        {quickLinks.length === 0 && (
          <Card className="col-span-full flex flex-col items-center py-12 text-center">
            <p className="text-sm text-muted">No self-service features are enabled for your account yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
