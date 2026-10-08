"use client";

import { use, useEffect, useState, FormEvent } from "react";
import { Building2, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { FullPageSpinner } from "@/components/ui/spinner";
import { getUnitAccessInfo, requestTenantAccessLink } from "@/lib/endpoints";
import { UnitAccessInfo } from "@/lib/types";
import { resolveImageUrl } from "@/lib/config";

export default function TenantAccessPage({ params }: PageProps<"/access/[slug]">) {
  const { slug } = use(params);
  const [info, setInfo] = useState<UnitAccessInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devMagicLink, setDevMagicLink] = useState<string | null>(null);

  useEffect(() => {
    getUnitAccessInfo(slug)
      .then(setInfo)
      .catch(() => setNotFound(true));
  }, [slug]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await requestTenantAccessLink(slug, email);
      setDevMagicLink(res.dev_magic_link ?? null);
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="premium-card max-w-sm p-8 text-center">
          <h1 className="text-lg font-semibold text-foreground">This link is invalid</h1>
          <p className="mt-2 text-sm text-muted">Please check with your landlord or property manager for a valid access link.</p>
        </div>
      </div>
    );
  }

  if (!info) return <FullPageSpinner />;

  return (
    <div className="ambient-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-end px-6 py-5">
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className={`text-center ${info.property_photo_url ? "mb-12" : "mb-8"}`}>
            {info.property_photo_url ? (
              <div className="relative mb-8">
                <div className="h-32 w-full overflow-hidden rounded-2xl shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(info.property_photo_url) ?? undefined}
                    alt={info.property_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div
                  className="absolute -bottom-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center overflow-hidden rounded-2xl text-white shadow-md ring-4 ring-background"
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
              </div>
            ) : (
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl text-white shadow-md"
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
            )}
            <h1 className="text-xl font-semibold text-foreground">{info.organization_name}</h1>
            <p className="mt-1 text-sm text-muted">
              {info.property_name} · Unit {info.unit_name}
            </p>
          </div>

          <div className="premium-card p-6">
            {sent ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircle2 className="mb-3 h-10 w-10 text-success" />
                <p className="text-sm font-medium text-foreground">Check your email</p>
                <p className="mt-1.5 text-sm text-muted">
                  If that email is registered for this unit, a secure one-time sign-in link is on its way. It
                  expires in 10 minutes.
                </p>
                {devMagicLink && (
                  <div className="mt-4 w-full rounded-lg border border-warning/30 bg-warning-bg p-3 text-left">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-warning">
                      Development mode — no email provider configured
                    </p>
                    <a href={devMagicLink} className="break-all text-xs text-foreground underline underline-offset-2">
                      {devMagicLink}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="mb-1.5 text-sm font-medium text-foreground">Sign in to your resident portal</p>
                  <p className="mb-3 text-sm text-muted">
                    Enter the email your landlord registered for this unit and we&apos;ll send you a secure sign-in
                    link.
                  </p>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      type="email"
                      required
                      autoFocus
                      className="pl-10"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" loading={loading}>
                  Send sign-in link
                </Button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
