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
import { createUtilityBill, listAllUnits, listStaffUtilityBills, updateUtilityBillStatus } from "@/lib/endpoints";
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

  async function handleStatus(bill: UtilityBill, status: UtilityBillStatus) {
    try {
      await updateUtilityBillStatus(bill.id, status);
      notify(status === "paid" ? "Marked as paid" : "Marked as pending");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update bill", "error");
    }
  }

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
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Utilities & billing</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New bill
        </Button>
      </div>

      {bills.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Receipt className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No bills yet</p>
        </Card>
      ) : (
        <>
        <div className="hidden overflow-x-auto premium-card p-0 sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
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
                  <td className="px-4 py-3.5 text-right">
                    {b.status === "paid" ? (
                      <Button size="sm" variant="ghost" onClick={() => handleStatus(b, "pending")}>
                        Undo
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleStatus(b, "paid")}>
                        Mark paid
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 sm:hidden">
          {bills.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold capitalize text-foreground">{b.utility_type}</p>
                  <p className="text-[12px] text-muted">{b.property_name} · {b.unit_name}</p>
                </div>
                <Badge tone={statusTone[b.status]}>{b.status}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-[12px]">
                <span className="text-muted">{b.period_start} – {b.period_end}</span>
                <span className="text-[13.5px] font-semibold tabular-nums text-foreground">{b.amount.toLocaleString()}</span>
              </div>
              <Button size="sm" variant={b.status === "paid" ? "ghost" : "outline"} className="mt-3 w-full" onClick={() => handleStatus(b, b.status === "paid" ? "pending" : "paid")}>
                {b.status === "paid" ? "Undo" : "Mark paid"}
              </Button>
            </Card>
          ))}
        </div>
        </>
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
