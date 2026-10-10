"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { staffLogin, staffLogout } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { FadeIn } from "@/components/ui/motion";
import { ProgressiveImage } from "@/components/ui/progressive-image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Block submits until hydrated so an early click can never fall back to a
  // native form submit (which would put the password in the URL).
  const [interactive, setInteractive] = useState(false);
  useEffect(() => setInteractive(true), []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const me = await staffLogin(email, password, needsMfa ? mfaCode : undefined);
      if (me.role === "super_admin") {
        await staffLogout();
        setError("This is the business sign-in. Platform administrators sign in at /admin.");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.message.toLowerCase().includes("mfa")) {
        setNeedsMfa(true);
        setError(err.message);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Photo side — hidden on small screens to keep the form the focus on mobile */}
      <div className="relative hidden w-1/2 overflow-hidden lg:block">
        <ProgressiveImage
          src="/images/hero-villa.jpg"
          alt="A property managed on HMS"
          className="absolute inset-0 h-full w-full"
          imgClassName="h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(160deg, color-mix(in srgb, var(--info) 75%, black) 0%, color-mix(in srgb, var(--primary-2) 50%, transparent) 55%, transparent 85%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">HMS</span>
          </Link>
          <div className="max-w-sm">
            <p className="font-display text-2xl font-semibold leading-snug">
              &ldquo;Every property, every resident, one dashboard.&rdquo;
            </p>
            <p className="mt-3 text-sm text-white/75">
              The house management system built for landlords who run more than a spreadsheet.
            </p>
          </div>
        </div>
      </div>

      <div className="ambient-bg flex w-full flex-col lg:w-1/2">
        <header className="flex items-center justify-between px-6 py-5 lg:justify-end">
          <Link href="/" className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl premium-gradient text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">HMS</span>
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <FadeIn>
              <div className="mb-8 text-center lg:text-left">
                <h1 className="font-display text-2xl font-semibold text-foreground">Welcome back</h1>
                <p className="mt-1.5 text-sm text-muted">Sign in to manage your properties</p>
              </div>

              <form onSubmit={handleSubmit} className="premium-card space-y-4 p-6">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <Input
                      id="email"
                      type="email"
                      required
                      autoFocus
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted" />
                    <PasswordInput
                      id="password"
                      required
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {needsMfa && (
                  <div>
                    <Label htmlFor="mfa">Authenticator code</Label>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="mfa"
                        inputMode="numeric"
                        autoFocus
                        className="pl-10"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        placeholder="6-digit code"
                      />
                    </div>
                  </div>
                )}

                {error && <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{error}</p>}

                <Button type="submit" className="w-full" disabled={!interactive} loading={loading}>
                  Sign in
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted lg:text-left">
                A resident instead?{" "}
                <span className="text-foreground">Use the link your landlord shared with you.</span>
              </p>
            </FadeIn>
          </div>
        </main>
      </div>
    </div>
  );
}
