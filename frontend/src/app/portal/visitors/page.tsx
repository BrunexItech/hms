"use client";

import { FormEvent, useEffect, useState } from "react";
import { ScanLine, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { createTenantVisitorBooking, listTenantVisitorBookings } from "@/lib/endpoints";
import { VisitorBooking, VisitorStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<VisitorStatus, "warning" | "success" | "danger" | "primary" | "neutral"> = {
  pending: "warning",
  approved: "primary",
  denied: "danger",
  checked_in: "success",
  checked_out: "neutral",
};

export default function TenantVisitorsPage() {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<VisitorBooking[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ visitor_name: "", visitor_phone: "", visit_date: "", expected_time: "", purpose: "" });

  async function refresh() {
    setBookings(await listTenantVisitorBookings());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createTenantVisitorBooking({
        ...form,
        visitor_phone: form.visitor_phone || undefined,
        expected_time: form.expected_time || undefined,
        purpose: form.purpose || undefined,
      });
      notify("Visitor booked");
      setOpen(false);
      setForm({ visitor_name: "", visitor_phone: "", visit_date: "", expected_time: "", purpose: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to book visitor", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!bookings) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Visitor bookings</h1>
          <p className="text-sm text-muted">Pre-register someone coming to visit you.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Book a visitor
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <ScanLine className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No visitors booked yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground">{b.visitor_name}</p>
                  <p className="text-xs text-muted">
                    {b.visit_date} {b.expected_time ? `at ${b.expected_time}` : ""}
                    {b.purpose ? ` · ${b.purpose}` : ""}
                  </p>
                </div>
                <Badge tone={statusTone[b.status]}>{b.status.replace("_", " ")}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Book a visitor">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="v-name">Visitor name</Label>
            <Input id="v-name" required value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="v-phone">Visitor phone (optional)</Label>
            <Input id="v-phone" value={form.visitor_phone} onChange={(e) => setForm({ ...form, visitor_phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="v-date">Visit date</Label>
              <Input id="v-date" type="date" required value={form.visit_date} onChange={(e) => setForm({ ...form, visit_date: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="v-time">Expected time</Label>
              <Input id="v-time" type="time" value={form.expected_time} onChange={(e) => setForm({ ...form, expected_time: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="v-purpose">Purpose (optional)</Label>
            <Textarea id="v-purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Book visitor
          </Button>
        </form>
      </Modal>
    </div>
  );
}
