const DEFAULT_API = "http://localhost:4000";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API;
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
