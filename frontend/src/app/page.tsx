import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, ScanLine, Receipt, MessageSquareWarning } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const features = [
  {
    icon: Building2,
    title: "Multi-branch by design",
    description: "One business account, unlimited properties, plots and units — all managed from a single control room.",
    tone: "premium-gradient",
  },
  {
    icon: ScanLine,
    title: "Invite-only resident access",
    description: "Tenants never sign up. A landlord registers their email first, then a unit link/QR gets them a secure sign-in.",
    tone: "gradient-info",
  },
  {
    icon: ShieldCheck,
    title: "Instant revocation",
    description: "Disable a tenancy when someone vacates and access is cut immediately — no lingering sessions.",
    tone: "gradient-danger",
  },
  {
    icon: Receipt,
    title: "Utilities & billing",
    description: "Track water, electricity and other bills per unit, visible to residents in real time.",
    tone: "gradient-warning",
  },
  {
    icon: MessageSquareWarning,
    title: "Complaints & visitors",
    description: "Residents raise maintenance issues and pre-register visitors without ever needing an app.",
    tone: "gradient-success",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl premium-gradient text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">HMS</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-xl premium-gradient px-5 text-sm font-medium text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="ambient-bg mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
          <span className="mb-5 inline-block rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted">
            Multi-tenant house management, built for real estate businesses
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Run every property,
            <br />
            <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-2)] bg-clip-text text-transparent">
              from one dashboard.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
            Properties, units, residents, complaints, visitors and billing — every module can be switched on or off
            per business, so the platform fits landlords managing one plot or an enterprise running dozens.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl premium-gradient px-6 text-sm font-semibold text-primary-foreground shadow-md transition-opacity hover:opacity-90"
            >
              Sign in to your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">
            A resident? Use the sign-in link or QR code your landlord shared with you.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="premium-card premium-card-interactive p-6">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-white ${f.tone}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-1.5 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-sm text-muted">
        © {new Date().getFullYear()} HMS. All rights reserved.
      </footer>
    </div>
  );
}
