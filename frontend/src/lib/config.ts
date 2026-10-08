export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8010/api/v1";

/** The backend returns upload URLs as a path (e.g. "/api/v1/uploads/images/x.jpg"),
 * which is correct when frontend+API share an origin (production, via nginx).
 * In local dev they're on different ports, so resolve against the API's own
 * origin there instead of letting the browser resolve it against the frontend. */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.startsWith("/") || !API_BASE_URL.includes("://")) return url;
  return new URL(url, API_BASE_URL).toString();
}
