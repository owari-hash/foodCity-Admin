import { getServerApiBaseUrl } from "@/lib/api";
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
  error: "unauthorized" | "unavailable" | null;
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
    return { data: null, error: "unavailable" };
  }
}

const serverFetchInit: RequestInit = { cache: "no-store" };

export async function apiGet<T>(path: string): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const base = getServerApiBaseUrl();
  const res = await fetch(`${base}${path}`, { ...serverFetchInit, headers: auth });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const base = getServerApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...serverFetchInit,
    method: "POST",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const auth = await getServerAdminAuthHeaders();
  const base = getServerApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...serverFetchInit,
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...auth },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const auth = await getServerAdminAuthHeaders();
  const base = getServerApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    ...serverFetchInit,
    method: "DELETE",
    headers: auth,
  });
  if (!res.ok && res.status !== 204) throw new Error(await res.text());
}
