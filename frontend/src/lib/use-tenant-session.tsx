"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTenantMe, getTenantModules } from "./endpoints";
import { ModuleInfo, TenantMe } from "./types";

interface TenantSessionValue {
  tenant: TenantMe | null;
  modules: ModuleInfo[];
  loading: boolean;
}

const TenantSessionContext = createContext<TenantSessionValue | null>(null);

/** Fetches the tenant session once per layout mount (the browser sends the
 * httpOnly session cookie automatically); nested pages read the result from
 * context instead of re-fetching /auth/tenant/me and /modules/tenant-me. */
export function TenantSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantMe | null>(null);
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const me = await getTenantMe();
        const mods = await getTenantModules();
        if (!cancelled) {
          setTenant(me);
          setModules(mods);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace("/access");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return <TenantSessionContext.Provider value={{ tenant, modules, loading }}>{children}</TenantSessionContext.Provider>;
}

export function useTenantSession() {
  const ctx = useContext(TenantSessionContext);
  if (!ctx) throw new Error("useTenantSession must be used within TenantSessionProvider");
  return ctx;
}
