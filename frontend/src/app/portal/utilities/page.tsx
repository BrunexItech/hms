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
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Utility bills</h1>
      <p className="mb-6 text-sm text-muted">Water, electricity and other charges for your unit.</p>

      {bills.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Receipt className="mb-3 h-10 w-10 text-muted" />
          <p className="font-medium text-foreground">No bills yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bills.map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold capitalize text-foreground">{b.utility_type}</p>
                <p className="text-xs text-muted">
                  {b.period_start} – {b.period_end}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-foreground">{b.amount.toLocaleString()}</p>
                <Badge tone={statusTone[b.status]}>{b.status}</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
