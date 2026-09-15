"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";
import { FullPageSpinner } from "@/components/ui/spinner";
import { verifyTenantAccessToken } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";

export default function VerifyAccessPage({ searchParams }: PageProps<"/access/verify">) {
  const { token } = use(searchParams);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || typeof token !== "string") {
      setError("This sign-in link is missing its token.");
      return;
    }
    verifyTenantAccessToken(token)
      .then(() => router.replace("/portal"))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "This link is invalid or has expired.");
      });
  }, [token, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="premium-card max-w-sm p-8 text-center">
          <XCircle className="mx-auto mb-3 h-10 w-10 text-danger" />
          <h1 className="text-lg font-semibold text-foreground">Couldn&apos;t sign you in</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return <FullPageSpinner />;
}
