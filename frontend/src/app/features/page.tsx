"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { AccentCard, AccentTone } from "@/components/marketing/accent-card";

const groups: { title: string; description: string; tone: AccentTone; items: { title: string; description: string }[] }[] = [
  {
    title: "Portfolio management",
    description: "Run one plot or a hundred units from the same control room.",
    tone: "primary",
    items: [
      {
        title: "Multi-branch by design",
        description: "One business account, unlimited properties and plots — each with its own units and residents.",
      },
      {
        title: "Unit & occupancy tracking",
        description: "Every unit shows live status — vacant or occupied — rolled up into a per-property occupancy rate.",
      },
      {
        title: "A QR code per unit",
        description: "Printable, regenerable access codes — stick one on every door and never hand out a password.",
      },
    ],
  },
  {
    title: "Resident experience",
    description: "Self-service that doesn't need an app or a password.",
    tone: "info",
    items: [
      {
        title: "Invite-only magic-link access",
        description: "Residents never sign up. A landlord registers their email first; a one-time link does the rest.",
      },
      {
        title: "Instant revocation",
        description: "Disable a tenancy when someone vacates and access is cut immediately — no lingering sessions.",
      },
      {
        title: "A dashboard that's actually theirs",
        description: "Rent, complaints, visitors and utilities — scoped to their unit, nothing else.",
      },
    ],
  },
  {
    title: "Day-to-day operations",
    description: "The requests that used to live in a notebook or a WhatsApp group.",
    tone: "success",
    items: [
      {
        title: "Complaints & maintenance",
        description: "Residents raise issues with a priority level; staff track status from open to resolved.",
      },
      {
        title: "Visitor pre-registration",
        description: "Residents book expected visitors ahead of time; staff approve, check in and check out.",
      },
      {
        title: "Utility billing",
        description: "Water, electricity, garbage and more — billed per unit and visible to residents in real time.",
      },
    ],
  },
  {
    title: "Finance",
    description: "Rent collection and the paper trail that comes with it.",
    tone: "warning",
    items: [
      {
        title: "Rent invoicing & payments",
        description: "Single or bulk invoices per property, partial payments tracked against each one automatically.",
      },
      {
        title: "Owner revenue picture",
        description: "Collected vs. outstanding, rolled up into a monthly trend on the dashboard overview.",
      },
      {
        title: "Full audit trail",
        description: "Every sensitive action — access changes, payments, edits — is logged with who, what and when.",
      },
    ],
  },
  {
    title: "Team & branding",
    description: "Make the platform feel like yours, not a shared tool.",
    tone: "danger",
    items: [
      {
        title: "Role-based staff accounts",
        description: "Owners and managers get scoped access, each with their own sign-in and activity log.",
      },
      {
        title: "Full custom branding",
        description: "Your logo, your brand color, your business name — across the dashboard, portal and sign-in page.",
      },
      {
        title: "Light & dark, everywhere",
        description: "Every screen, for every role, respects the theme your staff and residents prefer.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="/features" />

      <main className="flex-1">
        <section className="ambient-bg px-6 pb-16 pt-16 text-center sm:pt-24">
          <FadeIn>
            <span className="mb-5 inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
              Features
            </span>
            <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Every module a real
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] bg-clip-text text-transparent">
                {" "}
                HMS needs.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              Switch each one on per business, so the platform fits a landlord managing one plot just as well as an
              enterprise running dozens of properties.
            </p>
          </FadeIn>
        </section>

        {groups.map((group, gi) => (
          <section key={group.title} className="mx-auto max-w-6xl px-6 pb-20">
            <FadeIn>
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground sm:text-2xl">{group.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{group.description}</p>
              </div>
            </FadeIn>
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <StaggerItem key={item.title}>
                  <AccentCard tone={group.tone} title={item.title} description={item.description} />
                </StaggerItem>
              ))}
            </StaggerList>
            {gi < groups.length - 1 && <div className="mt-16 border-t border-border" />}
          </section>
        ))}

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
