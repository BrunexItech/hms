import { API_BASE_URL } from "./config";
import { Audience, clearTokens, getTokens, saveTokens } from "./auth-storage";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg as string;
  }
  return fallback;
}

async function refresh(audience: Audience): Promise<boolean> {
  const tokens = getTokens(audience);
  if (!tokens) return false;
  const res = await fetch(`${API_BASE_URL}/auth/${audience}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: tokens.refresh_token }),
  });
  if (!res.ok) {
    clearTokens(audience);
    return false;
  }
  const data = await res.json();
  saveTokens(audience, data);
  return true;
}

interface RequestOptions extends RequestInit {
  auth?: Audience | "none";
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = "none", headers, ...rest } = options;
  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };
    if (auth !== "none") {
      const tokens = getTokens(auth);
      if (tokens) finalHeaders["Authorization"] = `Bearer ${tokens.access_token}`;
    }
    return fetch(`${API_BASE_URL}${path}`, { ...rest, headers: finalHeaders });
  };

  let res = await doFetch();

  if (res.status === 401 && auth !== "none") {
    const refreshed = await refresh(auth);
    if (refreshed) {
      res = await doFetch();
    }
  }

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, extractMessage(body, `Request failed (${res.status})`), body);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
