"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { listOrganizations } from "@/lib/endpoints";
import { Organization } from "@/lib/types";

export default function SuperAdminOrganizations() {
  const [orgs, setOrgs] = useState<Organization[] | null>(null);

  useEffect(() => {
    listOrganizations().then(setOrgs);
  }, []);

  if (!orgs) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Organizations</h1>
          <p className="text-sm text-muted">Every business running on the platform.</p>
        </div>
        <Link href="/admin/organizations/new">
          <Button>
            <Plus className="h-4 w-4" /> New organization
          </Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Building2 className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No organizations yet</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {orgs.map((o) => (
            <Link key={o.id} href={`/admin/organizations/${o.id}`}>
              <Card interactive className="h-full overflow-hidden p-0">
                <div
                  className="dot-grid relative flex h-20 items-center px-5"
                  style={{ background: `linear-gradient(135deg, ${o.primary_color}, color-mix(in srgb, ${o.primary_color} 60%, black))` }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 text-white backdrop-blur-sm">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <ChevronRight className="absolute right-4 h-4 w-4 text-white/80" />
                </div>
                <div className="p-5">
                  <p className="font-display font-semibold text-foreground">{o.name}</p>
                  <p className="text-sm text-muted">/{o.slug}</p>
                  <div className="mt-3">
                    <Badge tone={o.is_active ? "success" : "danger"}>{o.is_active ? "Active" : "Suspended"}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
