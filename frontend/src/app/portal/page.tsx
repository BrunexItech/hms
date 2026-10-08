"use client";

import { MessageSquareWarning, ScanLine, Receipt, Wallet, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTenantSession } from "@/lib/use-tenant-session";
import { resolveImageUrl } from "@/lib/config";
import Link from "next/link";

const TONES: Record<string, string> = {
  rent: "text-primary bg-primary/10",
  complaints: "text-warning bg-warning/10",
  visitor_booking: "text-info bg-info/10",
  utilities: "text-success bg-success/10",
};

export default function PortalOverview() {
  const { tenant, modules } = useTenantSession();

  const quickLinks = [
    { key: "rent", label: "View rent & payments", href: "/portal/rent", icon: Wallet },
    { key: "complaints", label: "Raise a complaint", href: "/portal/complaints", icon: MessageSquareWarning },
    { key: "visitor_booking", label: "Book a visitor", href: "/portal/visitors", icon: ScanLine },
    { key: "utilities", label: "View utility bills", href: "/portal/utilities", icon: Receipt },
  ].filter((l) => modules.some((m) => m.key === l.key));

  return (
    <div>
      {tenant?.property_photo_url && (
        <div className="mb-4 h-28 w-full overflow-hidden rounded-2xl shadow-sm sm:h-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolveImageUrl(tenant.property_photo_url) ?? undefined} alt={tenant.property_name} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="mb-5">
        <h1 className="text-[15px] font-semibold text-foreground">Welcome, {tenant?.full_name.split(" ")[0]}</h1>
        <p className="text-[13px] text-muted">
          {tenant?.property_name} · Unit {tenant?.unit_name}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((l) => (
          <Link key={l.key} href={l.href}>
            <Card interactive className="flex h-full items-center gap-3.5 py-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONES[l.key]}`}>
                <l.icon className="h-4.5 w-4.5" />
              </div>
              <p className="flex-1 text-[13.5px] font-medium text-foreground">{l.label}</p>
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
