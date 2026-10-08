"use client";

import { FormEvent, use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Ban, CheckCircle2, Palette } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Label } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  getOrganization,
  listOrgAuditLogs,
  listOrgModules,
  reactivateOrganization,
  suspendOrganization,
  toggleOrgModule,
  updateOrganization,
} from "@/lib/endpoints";
import { AuditLogEntry, ModuleInfo, Organization } from "@/lib/types";
import { resolveIcon } from "@/lib/icon-map";
import { ApiError } from "@/lib/api";
import { resolveImageUrl } from "@/lib/config";

const PRESET_COLORS = ["#7C3AED", "#4F46E5", "#0EA5E9", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function describeAction(action: string): string {
  return action.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function OrganizationDetailPage({ params }: PageProps<"/admin/organizations/[id]">) {
  const { id: orgId } = use(params);
  const { notify } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [color, setColor] = useState("#7C3AED");
  const [savingBranding, setSavingBranding] = useState(false);
  const [modules, setModules] = useState<ModuleInfo[] | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[] | null>(null);
  const [busyModule, setBusyModule] = useState<string | null>(null);

  async function refresh() {
    const o = await getOrganization(orgId);
    setOrg(o);
    setName(o.name);
    setLogoUrl(o.logo_url);
    setColor(o.primary_color);
    setModules(await listOrgModules(orgId));
    setLogs(await listOrgAuditLogs(orgId));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  async function handleSaveBranding(e: FormEvent) {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const updated = await updateOrganization(orgId, { name, logo_url: logoUrl ?? "", primary_color: color });
      setOrg(updated);
      notify("Branding updated");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to save branding", "error");
    } finally {
      setSavingBranding(false);
    }
  }

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
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to suspend organization", "error");
    }
  }

  async function handleReactivate() {
    try {
      await reactivateOrganization(orgId);
      notify("Organization reactivated");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to reactivate organization", "error");
    }
  }

  if (!org || !modules) return <FullPageSpinner />;

  return (
    <div className="max-w-2xl">
      <Link href="/admin" className="mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Organizations
      </Link>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-[15px] font-semibold text-foreground">{org.name}</h1>
          <Badge tone={org.is_active ? "success" : "danger"}>{org.is_active ? "Active" : "Suspended"}</Badge>
        </div>
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
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Branding
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSaveBranding} className="space-y-5">
          <div>
            <Label htmlFor="org-name">Business name</Label>
            <Input id="org-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Logo</Label>
            <ImageUpload value={logoUrl} onChange={setLogoUrl} label="logo" shape="circle" />
          </div>
          <div>
            <Label>Brand color</Label>
            <div className="flex flex-wrap items-center gap-2.5">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className="h-9 w-9 rounded-full border-2 transition-transform hover:scale-105 cursor-pointer"
                  style={{ background: c, borderColor: color === c ? "var(--foreground)" : "transparent" }}
                  aria-label={c}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-9 cursor-pointer rounded-full border border-border bg-transparent p-0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl text-white shadow"
                style={{ background: color }}
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImageUrl(logoUrl) ?? undefined} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase() || "?"
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{name || "This business"}</p>
                <p className="text-xs text-muted">This is how residents will see their landlord&apos;s brand</p>
              </div>
            </div>
          </div>

          <Button type="submit" loading={savingBranding}>
            Save branding
          </Button>
        </form>
      </Card>

      <Card className="mt-5">
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
