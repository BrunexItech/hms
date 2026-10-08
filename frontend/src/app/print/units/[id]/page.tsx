"use client";

import { use, useEffect, useState } from "react";
import { Building2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrCode } from "@/components/ui/qr-code";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getUnitAccessInfo, getUnitAccessLink } from "@/lib/endpoints";
import { UnitAccessInfo } from "@/lib/types";
import { resolveImageUrl } from "@/lib/config";
import { useRouter } from "next/navigation";

export default function PrintUnitAccessPage({ params }: PageProps<"/print/units/[id]">) {
  const { id: unitId } = use(params);
  const router = useRouter();
  const [info, setInfo] = useState<UnitAccessInfo | null>(null);
  const [accessUrl, setAccessUrl] = useState<string | null>(null);

  useEffect(() => {
    getUnitAccessLink(unitId)
      .then(async (link) => {
        setAccessUrl(link.access_url);
        setInfo(await getUnitAccessInfo(link.access_slug));
      })
      .catch(() => router.replace("/login"));
  }, [unitId, router]);

  if (!info || !accessUrl) return <FullPageSpinner />;

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-6 py-10">
      <div className="mb-6 flex w-full max-w-sm justify-end print:hidden">
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" /> Print
        </Button>
      </div>

      <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-border bg-surface p-10 text-center shadow-sm print:border-2 print:border-black print:shadow-none">
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-white"
          style={{ background: info.organization_primary_color }}
        >
          {info.organization_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImageUrl(info.organization_logo_url) ?? undefined}
              alt={info.organization_name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Building2 className="h-7 w-7" />
          )}
        </div>
        <p className="text-sm font-medium text-muted">{info.organization_name}</p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">
          {info.property_name} — Unit {info.unit_name}
        </h1>

        <div className="my-8">
          <QrCode value={accessUrl} size={220} />
        </div>

        <p className="text-sm font-medium text-foreground">Scan to sign in to your resident portal</p>
        <p className="mt-1.5 text-xs text-muted">
          Only the email your landlord registered for this unit can be used to sign in.
        </p>
      </div>
    </div>
  );
}
