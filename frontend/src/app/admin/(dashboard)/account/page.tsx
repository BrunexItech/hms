"use client";

import { ChangePasswordCard } from "@/components/change-password-card";

export default function AdminAccountPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="mb-1 text-[15px] font-semibold text-foreground">Account</h1>
      <p className="mb-4 text-[13px] text-muted">Keep the platform administrator login secure.</p>
      <ChangePasswordCard />
    </div>
  );
}
