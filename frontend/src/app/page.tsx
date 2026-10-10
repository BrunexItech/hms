"use client";

import Link from "next/link";
import { ArrowRight, Building2, Wallet, Users, MessageSquareWarning } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { FadeIn, StaggerList, StaggerItem, CountUp } from "@/components/ui/motion";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { AccentCard } from "@/components/marketing/accent-card";
import { ProgressiveImage } from "@/components/ui/progressive-image";

const features = [
  {
    title: "Multi-branch by design",
    description: "One business account, unlimited properties, plots and units — all managed from a single control room.",
    tone: "primary" as const,
  },
  {
    title: "Invite-only resident access",
    description: "Tenants never sign up. A landlord registers their email first, then a unit link/QR gets them a secure sign-in.",
    tone: "info" as const,
  },
  {
    title: "Instant revocation",
    description: "Disable a tenancy when someone vacates and access is cut immediately — no lingering sessions.",
    tone: "danger" as const,
  },
  {
    title: "Utilities & billing",
    description: "Track water, electricity and other bills per unit, visible to residents in real time.",
    tone: "warning" as const,
  },
  {
    title: "Complaints & visitors",
    description: "Residents raise maintenance issues and pre-register visitors without ever needing an app.",
    tone: "success" as const,
  },
  {
    title: "Rent, tracked automatically",
    description: "Invoices, partial payments and outstanding balances, rolled up into one owner-facing revenue picture.",
    tone: "primary" as const,
  },
];

const steps = [
  {
    title: "You register the resident",
    description: "Add a tenant's email against their unit. No open sign-up — access only ever starts with you.",
    tone: "primary" as const,
  },
  {
    title: "They get a link or QR",
    description: "Print it, text it, or stick it on the door. Scanning it is the resident's entire onboarding.",
    tone: "info" as const,
  },
  {
    title: "Everyone gets their own dashboard",
    description: "You see every property; they see their unit — rent, complaints, visitors, utilities, self-service.",
    tone: "success" as const,
  },
];

const stats = [
  { value: 100, suffix: "%", label: "Data isolated per organization" },
  { value: 24, suffix: "/7", label: "Resident self-service access" },
  { value: 0, suffix: "", label: "Open sign-ups — invite-only, always", prefix: "" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="relative flex min-h-[640px] items-center overflow-hidden sm:min-h-[720px]">
            <ProgressiveImage
              fill
              src="/images/hero-villa.jpg"
              alt="A modern property managed on HMS"
              imgClassName="h-full w-full object-cover"
            />
            {/* An even photographic scrim, not a directional color wipe — the
                photo should read as one full image, with just enough
                darkening everywhere for the centered white text to stay
                legible. A diagonal tinted gradient here previously made the
                right half of the photo disappear into flat color. */}
            <div className="absolute inset-0 bg-black/35" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/15" />

            <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pt-10 text-center">
              <FadeIn>
                <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <Building2 className="h-3.5 w-3.5 text-[#7CF5D8]" />
                  The house management system for modern landlords
                </span>
              </FadeIn>
              <FadeIn delay={0.08}>
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Run every property,
                  <br />
                  <span className="bg-gradient-to-r from-[#7CF5D8] via-[#9CC7FF] to-[#D6B8FF] bg-clip-text text-transparent">
                    from one dashboard.
                  </span>
                </h1>
              </FadeIn>
              <FadeIn delay={0.16}>
                <p className="mx-auto mt-6 max-w-2xl text-lg text-white/85">
                  Properties, units, residents, complaints, visitors and billing — every module can be switched on or
                  off per business, so the platform fits landlords managing one plot or an enterprise running dozens.
                </p>
              </FadeIn>
              <FadeIn delay={0.24}>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-sm font-semibold text-[#161A2B] shadow-lg transition-transform hover:scale-[1.02]"
                  >
                    Sign in to your account <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="mt-4 text-sm text-white/70">
                  A resident? Use the sign-in link or QR code your landlord shared with you.
                </p>
              </FadeIn>
            </div>
          </div>

          <FadeIn delay={0.1}>
            <div className="mx-auto mt-10 max-w-xl px-6 sm:mt-14">
              <div className="elevated grid grid-cols-3 gap-6 rounded-2xl border border-border bg-surface px-6 py-6 sm:px-8">
                {stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                      <CountUp value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="mt-1 text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Product proof: a real preview of the dashboard, not a stock photo */}
          <FadeIn delay={0.18}>
            <div className="relative mx-auto mt-14 max-w-5xl px-6 pb-24">
              <div className="elevated gradient-ring overflow-hidden rounded-2xl bg-surface">
                <div className="flex items-center gap-2 border-b border-border/70 bg-surface-2 px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-danger/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
                  <span className="ml-3 text-xs text-muted">hms.oqtekal.com/dashboard</span>
                </div>
                <div className="p-5 sm:p-7">
                  <div className="mb-5 flex items-center gap-3 rounded-xl premium-gradient p-4 text-white">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold">Kilimani Luxury Apartments</p>
                      <p className="text-xs text-white/80">4 properties · 92% occupied</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <StatCard label="Occupancy" value="92%" hint="46/50 units" icon={Building2} tone="primary" />
                    <StatCard label="Active residents" value={46} icon={Users} tone="success" />
                    <StatCard label="Rent collected" value="2.1M" hint="of 2.3M due" icon={Wallet} tone="success" />
                    <StatCard label="Open complaints" value={3} icon={MessageSquareWarning} tone="warning" />
                  </div>
                </div>
              </div>
              <div
                className="pointer-events-none absolute inset-x-10 -bottom-10 -z-10 h-24 rounded-full opacity-40 blur-3xl"
                style={{ background: "linear-gradient(135deg, var(--info), var(--primary))" }}
              />
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <FadeIn>
            <div className="mx-auto mb-14 max-w-xl text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Invite-only, by design</h2>
              <p className="mt-3 text-muted">
                No open sign-up means no stranger ever lands in a resident&apos;s unit. Here&apos;s the whole flow.
              </p>
            </div>
          </FadeIn>
          <StaggerList className="grid gap-6 sm:grid-cols-3">
            {steps.map((s, i) => (
              <StaggerItem key={s.title}>
                <AccentCard tone={s.tone} eyebrow={`Step ${i + 1}`} title={s.title} description={s.description} />
              </StaggerItem>
            ))}
          </StaggerList>
          <FadeIn delay={0.1}>
            <div className="mt-8 text-center">
              <Link
                href="/how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                See the full invite flow <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <FadeIn>
              <div className="relative">
                <div className="elevated overflow-hidden rounded-3xl">
                  <ProgressiveImage
                    src="/images/hero-interior.jpg"
                    alt="A resident's home managed on HMS"
                    className="h-[320px] w-full sm:h-[400px]"
                    imgClassName="h-full w-full object-cover"
                  />
                </div>
                <div
                  className="pointer-events-none absolute -right-6 -top-6 -z-10 h-40 w-40 rounded-full opacity-50 blur-3xl"
                  style={{ background: "linear-gradient(135deg, var(--warning), var(--danger))" }}
                />
                <div
                  className="pointer-events-none absolute -bottom-8 -left-8 -z-10 h-40 w-40 rounded-full opacity-40 blur-3xl"
                  style={{ background: "linear-gradient(135deg, var(--success), var(--primary))" }}
                />
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <span className="mb-3 inline-block rounded-full gradient-warning px-3 py-1 text-xs font-semibold text-white">
                Resident experience
              </span>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Home should feel like home — even the admin.
              </h2>
              <p className="mt-4 text-muted">
                Residents get their own branded portal: pay rent, raise a complaint, book a visitor, check a utility
                bill — all without installing an app or remembering a password. Just the link or QR their landlord
                gave them.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Branded with their landlord's logo and color, not a generic SaaS shell", "Magic-link sign-in, no password to forget", "Every action — visitors, complaints, bills — in one place"].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full gradient-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <FadeIn>
            <div className="mx-auto mb-12 max-w-xl text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Every module a real HMS needs</h2>
              <p className="mt-3 text-muted">Switch each one on per business — nothing is one-size-fits-all.</p>
            </div>
          </FadeIn>
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <AccentCard tone={f.tone} title={f.title} description={f.description} />
              </StaggerItem>
            ))}
          </StaggerList>
          <FadeIn delay={0.1}>
            <div className="mt-8 text-center">
              <Link
                href="/features"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-opacity hover:opacity-80"
              >
                See all features <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <FadeIn>
            <Link href="/security" className="block">
              <div className="gradient-ring overflow-hidden rounded-2xl bg-surface p-8 transition-transform hover:-translate-y-0.5 sm:p-10">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-info">Security</p>
                <h3 className="text-lg font-semibold text-foreground sm:text-xl">
                  Every business is its own walled garden
                </h3>
                <p className="mt-2 max-w-2xl text-sm text-muted">
                  Organizations never see each other&apos;s properties, tenants or financials. Sessions use httpOnly
                  cookies with CSRF protection — not tokens sitting in browser storage. Disable a tenancy and access
                  is revoked immediately, everywhere.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Read our security practices <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
