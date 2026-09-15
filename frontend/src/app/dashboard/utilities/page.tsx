"use client";

import { FormEvent, useEffect, useState } from "react";
import { Receipt, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { createUtilityBill, listAllUnits, listStaffUtilityBills } from "@/lib/endpoints";
import { UtilityBill, UtilityBillStatus, Unit } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<UtilityBillStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  paid: "success",
  overdue: "danger",
};

export default function UtilitiesPage() {
  const { notify } = useToast();
  const [bills, setBills] = useState<UtilityBill[] | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    unit_id: "",
    utility_type: "water",
    period_start: "",
    period_end: "",
    amount: "",
  });

  async function refresh() {
    const [b, u] = await Promise.all([listStaffUtilityBills(), listAllUnits()]);
    setBills(b);
    setUnits(u);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUtilityBill({ ...form, amount: parseFloat(form.amount) });
      notify("Bill created");
      setOpen(false);
      setForm({ unit_id: "", utility_type: "water", period_start: "", period_end: "", amount: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to create bill", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!bills) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Utilities & billing</h1>
          <p className="text-sm text-muted">Water, electricity and other bills per unit.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Receipt className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No bills yet</p>
        </Card>
      ) : (
        <div className="overflow-x-auto premium-card p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {b.property_name} · {b.unit_name}
                  </td>
                  <td className="px-4 py-3.5 capitalize text-foreground">{b.utility_type}</td>
                  <td className="px-4 py-3.5 text-muted">
                    {b.period_start} – {b.period_end}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">{b.amount.toLocaleString()}</td>
                  <td className="px-4 py-3.5">
                    <Badge tone={statusTone[b.status]}>{b.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New utility bill">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select id="unit" required value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })}>
              <option value="" disabled>
                Select a unit
              </option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="type">Utility type</Label>
            <Select id="type" value={form.utility_type} onChange={(e) => setForm({ ...form, utility_type: e.target.value })}>
              <option value="water">Water</option>
              <option value="electricity">Electricity</option>
              <option value="garbage">Garbage</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Period start</Label>
              <Input id="start" type="date" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="end">Period end</Label>
              <Input id="end" type="date" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Create bill
          </Button>
        </form>
      </Modal>
    </div>
  );
}
