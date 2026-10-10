"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getMyAuditLogs } from "@/lib/endpoints";
import { AuditLogEntry } from "@/lib/types";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

function describeAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function describeMeta(meta: Record<string, unknown> | null): string | null {
  if (!meta) return null;
  return Object.entries(meta)
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
    .join(" · ");
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);

  useEffect(() => {
    getMyAuditLogs().then(setLogs);
  }, []);

  if (!logs) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-1 text-[15px] font-semibold text-foreground">Activity</h1>
      <p className="mb-4 text-[13px] text-muted">A record of sensitive actions taken on your account.</p>

      {logs.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-16 text-center">
            <History className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">Nothing recorded yet</p>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="premium-card divide-y divide-border overflow-hidden p-0">
          {logs.map((log) => {
            const detail = describeMeta(log.meta);
            return (
              <StaggerItem key={log.id}>
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-medium text-foreground">{describeAction(log.action)}</p>
                    <p className="shrink-0 text-[11.5px] text-muted">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                  {detail && <p className="mt-0.5 truncate text-[12px] text-muted">{detail}</p>}
                </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
