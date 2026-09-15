"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, PasswordInput } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { staffLogin, getStaffMe } from "@/lib/endpoints";
import { ApiError } from "@/lib/api";
import { clearTokens } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [needsMfa, setNeedsMfa] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await staffLogin(email, password, needsMfa ? mfaCode : undefined);
      const me = await getStaffMe();
      if (me.role === "super_admin") {
        clearTokens("staff");
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
    <div className="ambient-bg flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl premium-gradient text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">HMS</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
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

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            A resident instead?{" "}
            <span className="text-foreground">Use the link your landlord shared with you.</span>
          </p>
        </div>
      </main>
    </div>
  );
}
