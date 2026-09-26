"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { listStaffVisitorBookings, updateVisitorBookingStatus } from "@/lib/endpoints";
import { VisitorBooking, VisitorStatus } from "@/lib/types";
import { ApiError } from "@/lib/api";

const statusTone: Record<VisitorStatus, "warning" | "success" | "danger" | "primary" | "neutral"> = {
  pending: "warning",
  approved: "primary",
  denied: "danger",
  checked_in: "success",
  checked_out: "neutral",
};

export default function StaffVisitorsPage() {
  const { notify } = useToast();
  const [bookings, setBookings] = useState<VisitorBooking[] | null>(null);

  async function refresh() {
    setBookings(await listStaffVisitorBookings());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(id: string, status: VisitorStatus) {
    try {
      await updateVisitorBookingStatus(id, status);
      notify("Booking updated");
      await refresh();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Failed to update booking", "error");
    }
  }

  if (!bookings) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-4 text-[15px] font-semibold text-foreground">Visitor bookings</h1>

      {bookings.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <ScanLine className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No visitor bookings yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-foreground">{b.visitor_name}</p>
                  <p className="text-[13px] text-muted">
                    Visiting {b.tenant_name} · {b.unit_name}
                  </p>
                  <p className="text-[12px] text-muted">
                    {b.visit_date} {b.expected_time ? `at ${b.expected_time}` : ""}
                    {b.purpose ? ` · ${b.purpose}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={statusTone[b.status]}>{b.status.replace("_", " ")}</Badge>
                  {b.status === "pending" && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatus(b.id, "denied")}>
                        Deny
                      </Button>
                    </>
                  )}
                  {b.status === "approved" && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "checked_in")}>
                      Check in
                    </Button>
                  )}
                  {b.status === "checked_in" && (
                    <Button size="sm" variant="secondary" onClick={() => setStatus(b.id, "checked_out")}>
                      Check out
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
