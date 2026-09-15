export type Audience = "staff" | "tenant";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

function key(audience: Audience) {
  return `hms_${audience}_tokens`;
}

export function saveTokens(audience: Audience, tokens: TokenPair) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(audience), JSON.stringify(tokens));
}

export function getTokens(audience: Audience): TokenPair | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(audience));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TokenPair;
  } catch {
    return null;
  }
}

export function clearTokens(audience: Audience) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(audience));
}
