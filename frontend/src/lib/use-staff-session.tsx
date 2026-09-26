"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyModules, getStaffMe } from "./endpoints";
import { ModuleInfo, StaffMe } from "./types";

interface StaffSessionValue {
  staff: StaffMe | null;
  modules: ModuleInfo[];
  loading: boolean;
}

const StaffSessionContext = createContext<StaffSessionValue | null>(null);

/** Fetches the staff session once per layout mount (the browser sends the
 * httpOnly session cookie automatically); nested pages read the result from
 * context instead of re-fetching /auth/staff/me and /modules/me. */
export function StaffSessionProvider({
  children,
  loginPath = "/login",
}: {
  children: ReactNode;
  loginPath?: string;
}) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMe | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await getStaffMe();
        const mods = await getMyModules();
        if (!cancelled) {
          setStaff(me);
          setModules(mods);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace(loginPath);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router, loginPath]);

  return <StaffSessionContext.Provider value={{ staff, modules, loading }}>{children}</StaffSessionContext.Provider>;
}

export function useStaffSession() {
  const ctx = useContext(StaffSessionContext);
  if (!ctx) throw new Error("useStaffSession must be used within StaffSessionProvider");
  return ctx;
}
