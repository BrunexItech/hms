"use client";

import { useEffect, useState } from "react";
import { MessageSquareWarning } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { listStaffComplaints, updateComplaintStatus } from "@/lib/endpoints";
import { Complaint, ComplaintStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<ComplaintStatus, "warning" | "primary" | "success" | "neutral"> = {
  open: "warning",
  in_progress: "primary",
  resolved: "success",
  closed: "neutral",
};

const priorityTone: Record<Complaint["priority"], "neutral" | "warning" | "danger"> = {
  low: "neutral",
  medium: "warning",
  high: "danger",
};

export default function StaffComplaintsPage() {
  const { notify } = useToast();
  const [complaints, setComplaints] = useState<Complaint[] | null>(null);

  async function refresh() {
    setComplaints(await listStaffComplaints());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleStatusChange(id: string, status: ComplaintStatus) {
    try {
      await updateComplaintStatus(id, status);
      notify("Complaint updated");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update complaint", "error");
    }
  }

  if (!complaints) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Complaints</h1>
      <p className="mb-6 text-sm text-muted">Maintenance issues raised by residents.</p>

      {complaints.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <MessageSquareWarning className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No complaints yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{c.subject}</p>
                    <Badge tone={priorityTone[c.priority]}>{c.priority}</Badge>
                  </div>
                  <p className="text-sm text-muted">{c.description}</p>
                  <p className="mt-2 text-xs text-muted">
                    {c.tenant_name} · {c.unit_name} · {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[c.status]}>{c.status.replace("_", " ")}</Badge>
                  <Select
                    value={c.status}
                    onChange={(e) => handleStatusChange(c.id, e.target.value as ComplaintStatus)}
                    className="w-auto"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Select>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
