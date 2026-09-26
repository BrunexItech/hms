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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Organizations</h1>
        <Link href="/admin/organizations/new">
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" /> New organization
          </Button>
        </Link>
      </div>

      {orgs.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Building2 className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No organizations yet</p>
        </Card>
      ) : (
        <div className="premium-card divide-y divide-border overflow-hidden p-0">
          {orgs.map((o) => (
            <Link
              key={o.id}
              href={`/admin/organizations/${o.id}`}
              className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-2"
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                style={{ background: o.primary_color }}
              >
                <Building2 className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-medium text-foreground">{o.name}</p>
                <p className="truncate text-[12.5px] text-muted">/{o.slug}</p>
              </div>
              <Badge tone={o.is_active ? "success" : "danger"}>{o.is_active ? "Active" : "Suspended"}</Badge>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
