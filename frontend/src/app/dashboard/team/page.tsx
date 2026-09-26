"use client";

import { FormEvent, useEffect, useState } from "react";
import { Users2, Plus, UserX, UserCheck, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { deactivateStaff, inviteStaff, listStaff, reactivateStaff, resetStaffPassword } from "@/lib/endpoints";
import { StaffMember } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { useStaffSession } from "@/lib/use-staff-session";

export default function TeamPage() {
  const { staff } = useStaffSession();
  const { notify } = useToast();
  const [members, setMembers] = useState<StaffMember[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [resetTarget, setResetTarget] = useState<StaffMember | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const isOwner = staff?.role === "owner";

  async function refresh() {
    setMembers(await listStaff());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await inviteStaff(form);
      notify("Team member added");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to add team member", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await resetStaffPassword(resetTarget.id, resetPassword);
      notify(`${resetTarget.full_name}'s password has been reset`);
      setResetTarget(null);
      setResetPassword("");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to reset password", "error");
    } finally {
      setResetting(false);
    }
  }

  async function handleToggle(member: StaffMember) {
    try {
      if (member.is_active) {
        await deactivateStaff(member.id);
        notify(`${member.full_name}'s access has been revoked`);
      } else {
        await reactivateStaff(member.id);
        notify(`${member.full_name}'s access has been restored`);
      }
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update team member", "error");
    }
  }

  if (!members) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Team</h1>
        {isOwner && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add team member
          </Button>
        )}
      </div>

      {members.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Users2 className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No team members yet</p>
        </Card>
      ) : (
        <div className="premium-card divide-y divide-border overflow-hidden p-0">
          {members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-foreground">
                {m.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-medium text-foreground">{m.full_name}</p>
                <p className="text-[12px] text-muted">{m.email}</p>
              </div>
              <Badge tone="neutral">{m.role}</Badge>
              <Badge tone={m.is_active ? "success" : "danger"}>{m.is_active ? "Active" : "Disabled"}</Badge>
              {isOwner && m.role !== "owner" && (
                <Button variant="ghost" size="sm" onClick={() => setResetTarget(m)}>
                  <KeyRound className="h-3.5 w-3.5" /> Reset password
                </Button>
              )}
              {isOwner && m.role !== "owner" && (
                <Button variant={m.is_active ? "outline" : "secondary"} size="sm" onClick={() => handleToggle(m)}>
                  {m.is_active ? (
                    <>
                      <UserX className="h-3.5 w-3.5" /> Disable
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Restore
                    </>
                  )}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={!!resetTarget} onClose={() => setResetTarget(null)} title={`Reset password — ${resetTarget?.full_name ?? ""}`}>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <Label htmlFor="r-password">New temporary password</Label>
            <PasswordInput id="r-password" required minLength={8} value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} />
            <p className="mt-1 text-xs text-muted">Also clears any login lockout. Share it with them directly; they can change it in Settings.</p>
          </div>
          <Button type="submit" className="w-full" loading={resetting}>
            Reset password
          </Button>
        </form>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Add team member">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <Label htmlFor="m-name">Full name</Label>
            <Input id="m-name" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="m-email">Email</Label>
            <Input id="m-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="m-password">Temporary password</Label>
            <PasswordInput
              id="m-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="mt-1 text-xs text-muted">Share this with them directly. They can change it in Settings after signing in.</p>
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Add manager
          </Button>
        </form>
      </Modal>
    </div>
  );
}
