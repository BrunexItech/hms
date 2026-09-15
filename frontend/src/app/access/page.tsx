import Link from "next/link";
import { Building2, KeyRound } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AccessLandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl premium-gradient text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-foreground">HMS</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="premium-card max-w-sm p-8 text-center">
          <KeyRound className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">You&apos;ll need your unit&apos;s link</h1>
          <p className="mt-2 text-sm text-muted">
            Your session has ended. Scan the QR code or open the sign-in link your landlord shared with you to
            access your resident portal again.
          </p>
        </div>
      </main>
    </div>
  );
}
