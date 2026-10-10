"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const NAV_ITEMS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features", label: "Features" },
  { href: "/security", label: "Security" },
];

export function SiteHeader({ active }: { active?: string }) {
  return (
    <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-border/60 px-6 py-4 sm:px-10">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl premium-gradient text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <span className="font-display text-lg font-bold text-foreground">HMS</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm font-medium text-muted sm:flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              active === item.href
                ? "text-foreground"
                : "transition-colors hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
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
  );
}
