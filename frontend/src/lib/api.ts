import { API_BASE_URL } from "./config";
import { getCsrfToken } from "./csrf";

export type Audience = "staff" | "tenant";

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

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function refresh(audience: Audience): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/auth/${audience}/refresh`, {
    method: "POST",
    credentials: "include",
  });
  return res.ok;
}

interface RequestOptions extends RequestInit {
  auth?: Audience | "none";
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = "none", headers, method = "GET", ...rest } = options;

  const doFetch = async (): Promise<Response> => {
    const finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string>),
    };
    if (MUTATING.has(method.toUpperCase())) {
      const csrf = getCsrfToken();
      if (csrf) finalHeaders["X-CSRF-Token"] = csrf;
    }
    return fetch(`${API_BASE_URL}${path}`, { ...rest, method, headers: finalHeaders, credentials: "include" });
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

/** Multipart upload — separate from apiFetch because it must NOT set a
 * Content-Type header itself (the browser sets the multipart boundary). */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append("file", file);
  const headers: Record<string, string> = {};
  const csrf = getCsrfToken();
  if (csrf) headers["X-CSRF-Token"] = csrf;

  const res = await fetch(`${API_BASE_URL}/uploads/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: form,
  });

  if (!res.ok) {
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, extractMessage(body, `Upload failed (${res.status})`), body);
  }
  return res.json();
}
