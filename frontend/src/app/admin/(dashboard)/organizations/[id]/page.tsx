"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { listOrgAuditLogs, listOrgModules, reactivateOrganization, suspendOrganization, toggleOrgModule } from "@/lib/endpoints";
import { AuditLogEntry, ModuleInfo } from "@/lib/types";
import { resolveIcon } from "@/lib/icon-map";
import { ApiError } from "@/lib/api";

function describeAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrganizationDetailPage({ params }: PageProps<"/admin/organizations/[id]">) {
  const { id: orgId } = use(params);
  const { notify } = useToast();
  const [modules, setModules] = useState<ModuleInfo[] | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [busyModule, setBusyModule] = useState<string | null>(null);

  async function refresh() {
    setModules(await listOrgModules(orgId));
    setLogs(await listOrgAuditLogs(orgId));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function handleToggle(mod: ModuleInfo) {
    setBusyModule(mod.id);
    try {
      await toggleOrgModule(orgId, mod.id, !mod.enabled);
      notify(`${mod.name} ${!mod.enabled ? "enabled" : "disabled"} for this business`);
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update module", "error");
    } finally {
      setBusyModule(null);
    }
  }

  async function handleSuspend() {
    try {
      await suspendOrganization(orgId);
      notify("Organization suspended");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to suspend organization", "error");
    }
  }

  async function handleReactivate() {
    try {
      await reactivateOrganization(orgId);
      notify("Organization reactivated");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to reactivate organization", "error");
    }
  }

  if (!modules) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Organizations
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Modules</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSuspend}>
            <Ban className="h-3.5 w-3.5" /> Suspend
          </Button>
          <Button variant="secondary" size="sm" onClick={handleReactivate}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Reactivate
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Feature access</CardTitle>
        </CardHeader>
        <div className="space-y-1">
          {modules.map((m) => {
            const Icon = resolveIcon(m.icon);
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    {m.description && <p className="text-xs text-muted">{m.description}</p>}
                  </div>
                </div>
                <button
                  role="switch"
                  aria-checked={m.enabled}
                  disabled={busyModule === m.id}
                  onClick={() => handleToggle(m)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 cursor-pointer ${
                    m.enabled ? "premium-gradient" : "bg-surface-2 border border-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      m.enabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
        </CardHeader>
        {!logs || logs.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <div className="-mx-5 -mb-5 divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-medium text-foreground">{describeAction(log.action)}</p>
                  <p className="shrink-0 text-[11.5px] text-muted">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
