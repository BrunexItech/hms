"use client";

import { createContext, ReactNode, useContext } from "react";

interface Brand {
  name: string;
  logoUrl: string | null;
  color: string;
  refresh?: () => Promise<void> | void;
}

const BrandContext = createContext<Brand | null>(null);

export function BrandProvider({ brand, children }: { brand: Brand; children: ReactNode }) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

/** No provider (public pages, the initial "loading your session" screen
 * before we know who you are) → null, callers fall back to a generic look. */
export function useBrand(): Brand | null {
  return useContext(BrandContext);
}
