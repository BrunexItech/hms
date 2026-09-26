"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/ui/spinner";
import { listTenantRentInvoices } from "@/lib/endpoints";
import { RentInvoice, RentInvoiceStatus } from "@/lib/types";

const statusTone: Record<RentInvoiceStatus, "warning" | "success" | "danger" | "primary"> = {
  pending: "warning",
  partially_paid: "primary",
  paid: "success",
  overdue: "danger",
};

export default function TenantRentPage() {
  const [invoices, setInvoices] = useState<RentInvoice[] | null>(null);

  useEffect(() => {
    listTenantRentInvoices().then(setInvoices);
  }, []);

  if (!invoices) return <FullPageSpinner />;

  return (
    <div>
      <h1 className="mb-4 text-[15px] font-semibold text-foreground">Rent</h1>

      {invoices.length === 0 ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <Wallet className="mb-3 h-8 w-8 text-muted" />
          <p className="text-sm font-medium text-foreground">No rent invoices yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <Card key={inv.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <div>
                  <p className="whitespace-nowrap text-[13.5px] font-semibold text-foreground">
                    {inv.period_start} – {inv.period_end}
                  </p>
                  <p className="text-[12px] text-muted">Due {inv.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="whitespace-nowrap text-[13.5px] font-semibold tabular-nums text-foreground">
                    {inv.total_paid.toLocaleString()} / {inv.amount_due.toLocaleString()}
                  </p>
                  <Badge tone={statusTone[inv.status]}>{inv.status.replace("_", " ")}</Badge>
                </div>
              </div>
              {inv.payments.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-border pt-3">
                  {inv.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-[12px] text-muted">
                      <span>
                        {p.paid_at} · {p.method.replace("_", " ")}
                      </span>
                      <span className="tabular-nums text-foreground">{p.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
