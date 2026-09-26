"use client";

import { FormEvent, useState } from "react";
import { KeyRound } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label, PasswordInput } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { changePassword } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";

export function ChangePasswordCard() {
  const { notify } = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && next !== confirm;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (next !== confirm) return;
    setSaving(true);
    try {
      await changePassword(current, next);
      notify("Password updated");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Couldn't update your password", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" /> Password
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="cp-current">Current password</Label>
          <PasswordInput id="cp-current" required autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="cp-new">New password</Label>
          <PasswordInput id="cp-new" required minLength={8} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        <div>
          <Label htmlFor="cp-confirm">Confirm new password</Label>
          <PasswordInput id="cp-confirm" required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {mismatch && <p className="mt-1 text-xs text-danger">Passwords don&apos;t match.</p>}
        </div>
        <Button type="submit" loading={saving} disabled={mismatch}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
