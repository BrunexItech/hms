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
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Visitor bookings</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> Book a visitor
        </Button>
      </div>

      {bookings.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-16 text-center">
            <ScanLine className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">No visitors booked yet</p>
          </Card>
        </FadeIn>
      ) : (
        <StaggerList className="space-y-2">
          {bookings.map((b) => (
            <StaggerItem key={b.id}>
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[13.5px] font-semibold text-foreground">{b.visitor_name}</p>
                    <p className="text-[12px] text-muted">
                      {b.visit_date} {b.expected_time ? `at ${b.expected_time}` : ""}
                      {b.purpose ? ` · ${b.purpose}` : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone[b.status]}>{b.status.replace("_", " ")}</Badge>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
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
