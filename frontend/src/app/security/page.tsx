"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { AccentCard, AccentTone } from "@/components/marketing/accent-card";

const practices: { tone: AccentTone; title: string; description: string }[] = [
  {
    tone: "primary",
    title: "Per-organization data isolation",
    description:
      "Every business is its own walled garden. Organizations never see each other's properties, tenants, invoices or activity — enforced at the database query level, not just in the UI.",
  },
  {
    tone: "info",
    title: "httpOnly cookie sessions",
    description:
      "No tokens sit in browser storage where a script could read them. Sessions use httpOnly, same-site cookies with CSRF protection on every state-changing request.",
  },
  {
    tone: "danger",
    title: "Instant, real revocation",
    description:
      "Disabling a tenancy or staff account doesn't just hide it from a list — it invalidates the session immediately. There is no window where a revoked account can still act.",
  },
  {
    tone: "success",
    title: "Single-use, expiring sign-in links",
    description:
      "Resident magic links are single-use and time-limited. Once clicked, or once expired, that exact link can never be used again.",
  },
  {
    tone: "warning",
    title: "Rate-limited by design",
    description:
      "Sign-in link requests are rate-limited per unit and per visitor, so the public access endpoint can't be used to spam a resident's inbox or probe for valid emails.",
  },
  {
    tone: "info",
    title: "A real audit trail",
    description:
      "Sensitive actions — access changes, payments recorded, branding edits — are logged with who did it and when, visible to the business owner.",
  },
];

export default function SecurityPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="/security" />

      <main className="flex-1">
        <section className="ambient-bg px-6 pb-16 pt-16 text-center sm:pt-24">
          <FadeIn>
            <span className="mb-5 inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
              Security
            </span>
            <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Built to be trusted with
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] bg-clip-text text-transparent">
                {" "}
                someone&apos;s home.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              Access to where people live isn&apos;t something to be casual about. Here&apos;s what&apos;s actually
              enforced under the hood — not marketing language, the real mechanics.
            </p>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {practices.map((p) => (
              <StaggerItem key={p.title}>
                <AccentCard tone={p.tone} title={p.title} description={p.description} />
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <FadeIn>
            <div className="gradient-ring overflow-hidden rounded-2xl bg-surface p-8 sm:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">Passwords</p>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Never stored in plain text</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Staff passwords are hashed with a modern, industry-standard algorithm before they ever touch the
                database. Even with direct database access, no one can recover a usable password from it.
              </p>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-28 text-center">
          <FadeIn>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl premium-gradient px-6 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              Sign in to your account <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
