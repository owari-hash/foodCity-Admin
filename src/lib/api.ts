/** Default matches a backend served over plain HTTP (no TLS on API). */
const DEFAULT_API = "http://bukhbatllc.mn";

/**
 * Base URL for foodcity-back. By default, `https://` in env is rewritten to `http://`
 * unless `NEXT_PUBLIC_API_ALLOW_HTTPS=1` (use when API is really on HTTPS).
 */
export function getApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API).trim();
  if (process.env.NEXT_PUBLIC_API_ALLOW_HTTPS === "1") {
    return url.replace(/\/$/, "");
  }
  if (url.startsWith("https://")) {
    url = `http://${url.slice("https://".length)}`;
  }
  return url.replace(/\/$/, "");
}

/** See foodcity-front `getSocketBaseUrl` — Socket.io is not under `/api`. */
export function getSocketBaseUrl(): string {
  let u = getApiBaseUrl();
  if (u.endsWith("/api")) {
    u = u.slice(0, -4);
  }
  return u.replace(/\/$/, "");
}

export type AdminStats = {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  activeSalesAds: number;
  activeJobs: number;
};

export async function fetchAdminStats(): Promise<AdminStats | null> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/v1/admin/stats`, {
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (json && typeof json === "object" && "data" in json && json.data) {
      return json.data as AdminStats;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}${path}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}
