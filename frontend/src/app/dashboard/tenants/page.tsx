"use client";

import { FormEvent, useEffect, useState } from "react";
import { Users, UserX, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Label } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { disableTenancy, listTenancies, reactivateTenancy } from "@/lib/endpoints";
import { Tenancy, TenancyStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<TenancyStatus, "success" | "neutral" | "danger"> = {
  active: "success",
  vacated: "neutral",
  disabled: "danger",
};

export default function TenantsPage() {
  const { notify } = useToast();
  const [tenancies, setTenancies] = useState<Tenancy[] | null>(null);
  const [disableTarget, setDisableTarget] = useState<Tenancy | null>(null);
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState(false);

  async function refresh() {
    setTenancies(await listTenancies());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    if (!disableTarget) return;
    setWorking(true);
    try {
      await disableTenancy(disableTarget.id, reason || undefined);
      notify(`${disableTarget.full_name}'s access has been revoked`);
      setDisableTarget(null);
      setReason("");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to disable tenant", "error");
    } finally {
      setWorking(false);
    }
  }

  async function handleReactivate(t: Tenancy) {
    try {
      await reactivateTenancy(t.id);
      notify(`${t.full_name}'s access has been restored`);
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to reactivate tenant", "error");
    }
  }

  if (!tenancies) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Tenants</h1>
      <p className="mb-6 text-sm text-muted">Everyone with (or who has had) access to a unit.</p>

      {tenancies.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No tenants registered yet</p>
          <p className="mt-1 text-sm text-muted">Register a tenant from a unit&apos;s page in Properties.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto premium-card p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Since</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tenancies.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-foreground">{t.full_name}</p>
                    <p className="text-xs text-muted">{t.email}</p>
                  </td>
                  <td className="px-4 py-3.5 text-foreground">
                    {t.property_name} · {t.unit_name}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={statusTone[t.status]}>{t.status}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-muted">{t.start_date}</td>
                  <td className="px-4 py-3.5 text-right">
                    {t.status === "active" ? (
                      <Button variant="outline" size="sm" onClick={() => setDisableTarget(t)}>
                        <UserX className="h-3.5 w-3.5" /> Disable
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleReactivate(t)}>
                        <UserCheck className="h-3.5 w-3.5" /> Reactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!disableTarget} onClose={() => setDisableTarget(null)} title={`Disable ${disableTarget?.full_name ?? ""}`}>
        <form onSubmit={handleDisable} className="space-y-4">
          <p className="text-sm text-muted">
            This immediately revokes their sign-in access to Unit {disableTarget?.unit_name} — any active session is
            cut instantly. Use this when a resident vacates.
          </p>
          <div>
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Moved out on 15 Sept" />
          </div>
          <Button type="submit" variant="danger" className="w-full" loading={working}>
            Disable access
          </Button>
        </form>
      </Modal>
    </div>
  );
}
