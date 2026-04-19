import { getBackendUpstreamUrlCandidates } from "@/lib/api";
import { getServerAdminAuthHeaders } from "@/lib/serverAdminAuth";

export type AdminStats = {
  ordersToday: number;
  revenueToday: number;
  pendingOrders: number;
  activeSalesAds: number;
  activeJobs: number;
  totalOrders?: number;
  openConversations?: number;
  humanModeChats?: number;
};

export type AdminStatsResult = {
  data: AdminStats | null;
  error: "unauthorized" | "forbidden" | "unavailable" | null;
};

export async function fetchAdminStats(): Promise<AdminStatsResult> {
  try {
    const res = await apiGet<{ data: AdminStats }>("/api/v1/admin/stats");
    return { data: res.data, error: null };
  } catch (error) {
    console.error("fetchAdminStats error:", error);
    const msg = error instanceof Error ? error.message.toLowerCase() : "";
    if (
      msg.includes("unauthorized") ||
      msg.includes("invalid authorization") ||
      msg.includes("invalid or expired token") ||
      msg.includes("missing or invalid authorization")
    ) {
      return { data: null, error: "unauthorized" };
    }
    if (msg.includes("forbidden") || msg.includes("permission denied")) {
      return { data: null, error: "forbidden" };
    }
    return { data: null, error: "unavailable" };
  }
}

const serverFetchInit: RequestInit = { cache: "no-store" };

/** Try public API URL then loopback (same as login route) — server cannot always reach its own hostname. */
async function backendFetch(path: string, init: RequestInit): Promise<Response> {
  const urls = getBackendUpstreamUrlCandidates(path);
  let lastErr: unknown;
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    try {
      const res = await fetch(url, { ...serverFetchInit, ...init });
      if (res.ok) return res;
      if (res.status === 401 || res.status === 403) return res;
      lastErr = new Error(await res.text());
      if (i < urls.length - 1) continue;
      throw lastErr;
    } catch (e) {
      lastErr = e;
      if (i < urls.length - 1) continue;
      throw lastErr instanceof Error ? lastErr : new Error(String(e));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("API request failed");
}

export async function apiGet<T>(path: string): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const res = await backendFetch(path, { headers: auth });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const res = await backendFetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const res = await backendFetch(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const auth = await getServerAdminAuthHeaders();
  const res = await backendFetch(path, {
    method: "DELETE",
    headers: auth,
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}
