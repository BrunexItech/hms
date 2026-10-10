"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { staffLogin, staffLogout } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { FadeIn } from "@/components/ui/motion";

export default function AdminLoginPage() {
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
      if (me.role !== "super_admin") {
        await staffLogout();
        setError("This sign-in is for platform administrators only. Use /login instead.");
        return;
      }
      router.push("/admin");
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
    <div className="ambient-bg flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-info text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">Platform Admin</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <FadeIn>
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Admin sign-in</h1>
            <p className="mt-1.5 text-sm text-muted">Restricted to platform super-administrators</p>
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
                  placeholder="admin@yourplatform.com"
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

            <Button type="submit" className="w-full gradient-info" disabled={!interactive} loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Running a business here?{" "}
            <a href="/login" className="text-foreground underline underline-offset-2">
              Sign in at /login
            </a>
          </p>
          </FadeIn>
        </div>
      </main>
    </div>
  );
}
