"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { FadeIn, StaggerList, StaggerItem } from "@/components/ui/motion";
import { AccentTone } from "@/components/marketing/accent-card";

const toneVar: Record<AccentTone, string> = {
  primary: "var(--primary)",
  info: "var(--info)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};

const timeline: { tone: AccentTone; title: string; description: string }[] = [
  {
    tone: "primary",
    title: "A landlord registers the resident",
    description:
      "You add a tenant's name, email and phone against their specific unit. There's no public sign-up page anywhere in the product — a resident account only ever comes into existence because a landlord or manager created it first.",
  },
  {
    tone: "info",
    title: "A unique link and QR code are generated",
    description:
      "Every unit gets its own access link and scannable QR code. Print it and stick it on the door, text it, or hand it over at move-in. Scanning or visiting the link takes the resident straight to that unit's sign-in page.",
  },
  {
    tone: "success",
    title: "The resident signs in with a one-time link",
    description:
      "They enter the email their landlord registered. If it matches an active tenancy on that unit, a secure, single-use sign-in link is emailed to them — expiring after a set window and useless once clicked.",
  },
  {
    tone: "warning",
    title: "They land in their own branded portal",
    description:
      "From there it's rent, complaints, visitor bookings and utility bills — all scoped to their unit, styled with their landlord's logo and color. No app to install, nothing to configure.",
  },
  {
    tone: "danger",
    title: "Future sign-ins are just as quick",
    description:
      "Sessions stay signed in for a reasonable window, and returning is a matter of the same link flow — no password to forget, no account recovery flow to build or break.",
  },
];

const faqs = [
  {
    question: "What happens when a resident moves out?",
    answer:
      "A landlord disables the tenancy in one click. Access is revoked immediately — any active session is cut, and the old access link stops working. The unit's QR code can also be regenerated so even the physical link is dead.",
  },
  {
    question: "Can a resident sign up on their own?",
    answer:
      "No. There is no public registration page for residents anywhere in the product. An account only exists because a landlord explicitly created it against a specific unit and email address.",
  },
  {
    question: "What if someone loses the link or QR code?",
    answer:
      "The landlord can regenerate it at any time from the unit's page — the old one is invalidated the moment a new one is issued.",
  },
  {
    question: "Does a resident need to install anything?",
    answer:
      "No app, no download. The portal runs in any mobile or desktop browser the moment they follow their sign-in link.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader active="/how-it-works" />

      <main className="flex-1">
        <section className="ambient-bg px-6 pb-16 pt-16 text-center sm:pt-24">
          <FadeIn>
            <span className="mb-5 inline-flex items-center rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
              How it works
            </span>
            <h1 className="font-display mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Invite-only access,
              <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] bg-clip-text text-transparent">
                {" "}
                start to finish.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
              No stranger ever lands in a resident&apos;s unit, because no account exists until a landlord creates
              one. Here&apos;s the entire flow, end to end.
            </p>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <StaggerList className="space-y-6">
            {timeline.map((step, i) => (
              <StaggerItem key={step.title}>
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div
                      className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white"
                      style={{ background: toneVar[step.tone] }}
                    >
                      {i + 1}
                    </div>
                    {i < timeline.length - 1 && <div className="mt-2 w-px flex-1 bg-border" />}
                  </div>
                  <div className="premium-card mb-2 flex-1 border-l-[3px] p-5" style={{ borderLeftColor: toneVar[step.tone] }}>
                    <h3 className="mb-1.5 text-base font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted">{step.description}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <FadeIn>
            <div className="gradient-ring overflow-hidden rounded-2xl bg-surface p-8 sm:p-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-danger">Revocation</p>
              <h3 className="text-lg font-semibold text-foreground sm:text-xl">Instant, not eventual</h3>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Disabling a tenancy doesn&apos;t just hide a resident from the list — it ends their session and
                invalidates their access immediately, the moment you click the button.
              </p>
            </div>
          </FadeIn>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-24">
          <FadeIn>
            <div className="mb-10 text-center">
              <span className="mb-3 inline-flex items-center rounded-full gradient-info px-3 py-1 text-xs font-semibold text-white">
                Common questions
              </span>
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Before you ask</h2>
            </div>
          </FadeIn>
          <StaggerList className="space-y-3">
            {faqs.map((faq) => (
              <StaggerItem key={faq.question}>
                <div className="premium-card p-5">
                  <h3 className="mb-1.5 text-sm font-semibold text-foreground">{faq.question}</h3>
                  <p className="text-sm text-muted">{faq.answer}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
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
