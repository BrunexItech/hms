"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquareWarning, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { createTenantComplaint, listTenantComplaints } from "@/lib/endpoints";
import { Complaint, ComplaintStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<ComplaintStatus, "warning" | "primary" | "success" | "neutral"> = {
  open: "warning",
  in_progress: "primary",
  resolved: "success",
  closed: "neutral",
};

export default function TenantComplaintsPage() {
  const { notify } = useToast();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });

  async function refresh() {
    setComplaints(await listTenantComplaints());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createTenantComplaint(form);
      notify("Complaint submitted");
      setOpen(false);
      setForm({ subject: "", description: "", priority: "medium" });
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to submit complaint", "error");
    } finally {
      setSaving(false);
    }
  }

  if (!complaints) return <FullPageSpinner />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-[15px] font-semibold text-foreground">Complaints</h1>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-3.5 w-3.5" /> New complaint
        </Button>
      </div>

      {complaints.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <MessageSquareWarning className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No complaints yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {complaints.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-[13.5px] font-semibold text-foreground">{c.subject}</p>
                <Badge tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Badge>
              </div>
              <p className="text-[13px] text-muted">{c.description}</p>
              <p className="mt-1.5 text-[12px] text-muted">{new Date(c.created_at).toLocaleDateString()}</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New complaint">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" loading={saving}>
            Submit complaint
          </Button>
        </form>
      </Modal>
    </div>
  );
}
