"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { listTenantUtilityBills } from "@/lib/endpoints";
import { UtilityBill, UtilityBillStatus } from "@/lib/types";

const statusTone: Record<UtilityBillStatus, "warning" | "success" | "danger"> = {
  pending: "warning",
  paid: "success",
  overdue: "danger",
};

export default function TenantUtilitiesPage() {
  const [bills, setBills] = useState<UtilityBill[] | null>(null);

  useEffect(() => {
    listTenantUtilityBills().then(setBills);
  }, []);

  if (!bills) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-4 text-[15px] font-semibold text-foreground">Utility bills</h1>

      {bills.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Receipt className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No bills yet</p>
        </Card>
      ) : (
        <div className="premium-card divide-y divide-border overflow-hidden p-0">
          {bills.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[13.5px] font-medium capitalize text-foreground">{b.utility_type}</p>
                <p className="text-[12px] text-muted">
                  {b.period_start} – {b.period_end}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <p className="text-[13.5px] font-semibold tabular-nums text-foreground">{b.amount.toLocaleString()}</p>
                <Badge tone={statusTone[b.status]}>{b.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
