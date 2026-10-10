import Link from "next/link";
import { Building2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg premium-gradient text-white">
            <Building2 className="h-4 w-4" />
          </div>
          <span className="font-display text-base font-bold text-foreground">HMS</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted">
          <Link href="/how-it-works" className="transition-colors hover:text-foreground">
            How it works
          </Link>
          <Link href="/features" className="transition-colors hover:text-foreground">
            Features
          </Link>
          <Link href="/security" className="transition-colors hover:text-foreground">
            Security
          </Link>
          <Link href="/login" className="transition-colors hover:text-foreground">
            Staff sign in
          </Link>
        </nav>
      </div>
      <p className="mt-8 text-center text-xs text-muted sm:text-left">
        © {new Date().getFullYear()} HMS. All rights reserved.
      </p>
    </footer>
  );
}
