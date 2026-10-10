"use client";

import { FormEvent, useEffect, useState } from "react";
import { Wallet, Plus, Layers, Banknote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import {
  bulkCreateRentInvoices,
  createRentInvoice,
  listAllUnits,
  listProperties,
  listStaffRentInvoices,
  recordRentPayment,
} from "@/lib/endpoints";
import { Property, RentInvoice, RentInvoiceStatus, Unit } from "@/lib/types";
import { ApiError } from "@/lib/api";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";

const statusTone: Record<RentInvoiceStatus, "warning" | "success" | "danger" | "primary"> = {
  pending: "warning",
  partially_paid: "primary",
  paid: "success",
  overdue: "danger",
};

export default function RentPage() {
  const { notify } = useToast();
  const [invoices, setInvoices] = useState<RentInvoice[] | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  const [singleOpen, setSingleOpen] = useState(false);
  const [singleSaving, setSingleSaving] = useState(false);
  const [singleForm, setSingleForm] = useState({ unit_id: "", period_start: "", period_end: "", amount_due: "", due_date: "" });

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkForm, setBulkForm] = useState({ property_id: "", period_start: "", period_end: "", amount_due: "", due_date: "" });

  const [paymentTarget, setPaymentTarget] = useState<RentInvoice | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "cash", paid_at: "", notes: "" });

  async function refresh() {
    const [inv, u, p] = await Promise.all([listStaffRentInvoices(), listAllUnits(), listProperties()]);
    setInvoices(inv);
    setUnits(u);
    setProperties(p);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreateSingle(e: FormEvent) {
    e.preventDefault();
    setSingleSaving(true);
    try {
      await createRentInvoice({ ...singleForm, amount_due: parseFloat(singleForm.amount_due) });
      notify("Invoice created");
      setSingleOpen(false);
      setSingleForm({ unit_id: "", period_start: "", period_end: "", amount_due: "", due_date: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to create invoice", "error");
    } finally {
      setSingleSaving(false);
    }
  }

  async function handleBulkCreate(e: FormEvent) {
    e.preventDefault();
    setBulkSaving(true);
    try {
      const created = await bulkCreateRentInvoices({ ...bulkForm, amount_due: parseFloat(bulkForm.amount_due) });
      notify(`${created.length} invoice${created.length === 1 ? "" : "s"} created`);
      setBulkOpen(false);
      setBulkForm({ property_id: "", period_start: "", period_end: "", amount_due: "", due_date: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to bulk-create invoices", "error");
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleRecordPayment(e: FormEvent) {
    e.preventDefault();
    if (!paymentTarget) return;
    setPaymentSaving(true);
    try {
      await recordRentPayment(paymentTarget.id, { ...paymentForm, amount: parseFloat(paymentForm.amount), notes: paymentForm.notes || undefined });
      notify("Payment recorded");
      setPaymentTarget(null);
      setPaymentForm({ amount: "", method: "cash", paid_at: "", notes: "" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to record payment", "error");
    } finally {
      setPaymentSaving(false);
    }
  }

  if (!invoices) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Rent & payments</h1>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setBulkOpen(true)}>
            <Layers className="h-3.5 w-3.5" /> Bill a whole property
          </Button>
          <Button size="sm" onClick={() => setSingleOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New invoice
          </Button>
        </div>
      </div>

      {invoices.length === 0 ? (
        <FadeIn>
          <Card className="flex flex-col items-center py-16 text-center">
            <Wallet className="mb-3 h-8 w-8 text-muted" />
            <p className="text-sm font-medium text-foreground">No rent invoices yet</p>
          </Card>
        </FadeIn>
      ) : (
        <>
        <FadeIn className="hidden overflow-x-auto premium-card p-0 sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3.5 text-foreground">
                    {inv.property_name} · {inv.unit_name}
                  </td>
                  <td className="px-4 py-3.5 text-foreground">{inv.tenant_name}</td>
                  <td className="px-4 py-3.5 text-muted">
                    {inv.period_start} – {inv.period_end}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{inv.due_date}</td>
                  <td className="px-4 py-3.5 font-medium tabular-nums text-foreground">
                    {inv.total_paid.toLocaleString()} / {inv.amount_due.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5">
                    <Badge tone={statusTone[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {inv.status !== "paid" && (
                      <Button size="sm" variant="outline" onClick={() => setPaymentTarget(inv)}>
                        <Banknote className="h-3.5 w-3.5" /> Record payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FadeIn>
        <StaggerList className="space-y-2 sm:hidden">
          {invoices.map((inv) => (
            <StaggerItem key={inv.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-foreground">{inv.property_name} · {inv.unit_name}</p>
                    <p className="text-[12px] text-muted">{inv.tenant_name}</p>
                  </div>
                  <Badge tone={statusTone[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                </div>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12px]">
                  <dt className="text-muted">Period</dt>
                  <dd className="whitespace-nowrap text-right text-foreground">{inv.period_start} – {inv.period_end}</dd>
                  <dt className="text-muted">Due</dt>
                  <dd className="text-right text-foreground">{inv.due_date}</dd>
                  <dt className="text-muted">Paid</dt>
                  <dd className="text-right font-medium tabular-nums text-foreground">{inv.total_paid.toLocaleString()} / {inv.amount_due.toLocaleString()}</dd>
                </dl>
                {inv.status !== "paid" && (
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => setPaymentTarget(inv)}>
                    <Banknote className="h-3.5 w-3.5" /> Record payment
                  </Button>
                )}
              </Card>
            </StaggerItem>
          ))}
        </StaggerList>
        </>
      )}

      <Modal open={singleOpen} onClose={() => setSingleOpen(false)} title="New rent invoice">
        <form onSubmit={handleCreateSingle} className="space-y-4">
          <div>
            <Label htmlFor="s-unit">Unit</Label>
            <Select id="s-unit" required value={singleForm.unit_id} onChange={(e) => setSingleForm({ ...singleForm, unit_id: e.target.value })}>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="s-start">Period start</Label>
              <Input id="s-start" type="date" required value={singleForm.period_start} onChange={(e) => setSingleForm({ ...singleForm, period_start: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="s-end">Period end</Label>
              <Input id="s-end" type="date" required value={singleForm.period_end} onChange={(e) => setSingleForm({ ...singleForm, period_end: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="s-amount">Amount due</Label>
            <Input id="s-amount" type="number" step="0.01" required value={singleForm.amount_due} onChange={(e) => setSingleForm({ ...singleForm, amount_due: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="s-due">Due date</Label>
            <Input id="s-due" type="date" required value={singleForm.due_date} onChange={(e) => setSingleForm({ ...singleForm, due_date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" loading={singleSaving}>
            Create invoice
          </Button>
        </form>
      </Modal>

      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bill a whole property">
        <form onSubmit={handleBulkCreate} className="space-y-4">
          <p className="text-sm text-muted">Creates one invoice for every unit in this property that has an active tenant.</p>
          <div>
            <Label htmlFor="b-property">Property</Label>
            <Select id="b-property" required value={bulkForm.property_id} onChange={(e) => setBulkForm({ ...bulkForm, property_id: e.target.value })}>
              <option value="" disabled>
                Select a property
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="b-start">Period start</Label>
              <Input id="b-start" type="date" required value={bulkForm.period_start} onChange={(e) => setBulkForm({ ...bulkForm, period_start: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="b-end">Period end</Label>
              <Input id="b-end" type="date" required value={bulkForm.period_end} onChange={(e) => setBulkForm({ ...bulkForm, period_end: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="b-amount">Amount due per unit</Label>
            <Input id="b-amount" type="number" step="0.01" required value={bulkForm.amount_due} onChange={(e) => setBulkForm({ ...bulkForm, amount_due: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="b-due">Due date</Label>
            <Input id="b-due" type="date" required value={bulkForm.due_date} onChange={(e) => setBulkForm({ ...bulkForm, due_date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" loading={bulkSaving}>
            Create invoices
          </Button>
        </form>
      </Modal>

      <Modal open={!!paymentTarget} onClose={() => setPaymentTarget(null)} title={`Record payment — ${paymentTarget?.unit_name ?? ""}`}>
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {paymentTarget && (
            <p className="text-sm text-muted">
              {paymentTarget.total_paid.toLocaleString()} of {paymentTarget.amount_due.toLocaleString()} paid so far.
            </p>
          )}
          <div>
            <Label htmlFor="p-amount">Amount</Label>
            <Input id="p-amount" type="number" step="0.01" required value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="p-method">Method</Label>
            <Select id="p-method" value={paymentForm.method} onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="mpesa">M-Pesa</option>
              <option value="bank_transfer">Bank transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="p-date">Date paid</Label>
            <Input id="p-date" type="date" required value={paymentForm.paid_at} onChange={(e) => setPaymentForm({ ...paymentForm, paid_at: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="p-notes">Notes (optional)</Label>
            <Input id="p-notes" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
          </div>
          <Button type="submit" className="w-full" loading={paymentSaving}>
            Record payment
          </Button>
        </form>
      </Modal>
    </div>
  );
}
