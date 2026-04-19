import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";

const STORAGE_KEY = "fc_admin_jwt";
const PROFILE_KEY = "fc_admin_profile";

/** Mirrors foodcity-back `ADMIN_PERMISSIONS` + upload rule. */
export const ADMIN_PERMISSION_KEYS = [
  "dashboard",
  "orders",
  "sales-ads",
  "jobs",
  "chat",
  "site-content",
  "admin-users",
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export type AdminClientProfile = {
  username: string;
  displayName: string;
  permissions: string[];
};

export function readClientAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function readClientAdminProfile(): AdminClientProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AdminClientProfile>;
    if (typeof p.username !== "string" || typeof p.displayName !== "string") return null;
    const permissions = Array.isArray(p.permissions)
      ? p.permissions.filter((x): x is string => typeof x === "string")
      : [];
    return { username: p.username, displayName: p.displayName, permissions };
  } catch {
    return null;
  }
}

export function writeClientAdminToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function writeClientAdminSession(token: string, profile: AdminClientProfile): void {
  sessionStorage.setItem(STORAGE_KEY, token);
  sessionStorage.setItem(
    PROFILE_KEY,
    JSON.stringify({
      username: profile.username,
      displayName: profile.displayName,
      permissions: profile.permissions,
    }),
  );
}

export function clearClientAdminToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

export function adminClientHasPermission(
  permissions: string[] | undefined,
  required: AdminPermissionKey | "upload",
): boolean {
  const p = permissions ?? [];
  if (p.includes("*")) return true;
  if (required === "upload") {
    return (
      p.includes("sales-ads") ||
      p.includes("jobs") ||
      p.includes("site-content")
    );
  }
  return p.includes(required);
}

/** Browser-only: cross-origin API calls cannot send the admin httpOnly cookie. */
export function withClientAdminAuth(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers ?? undefined);
  const t = readClientAdminToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return { ...init, headers };
}

export type ClientAuthGate = "ok" | "forbidden" | "session-ended";

export const PERMISSION_DENIED_MN = "Энэ үйлдлийг хийх эрх байхгүй.";

/** Redirect to login on 401; return `forbidden` on 403 without logging out. */
export async function ensureClientAuthorized(res: Response): Promise<ClientAuthGate> {
  if (res.status === 403) return "forbidden";

  let unauthorized = res.status === 401;
  if (!unauthorized) {
    try {
      const parsed = (await res.clone().json()) as {
        error?: { code?: string; message?: string };
      };
      unauthorized = (parsed.error?.code ?? "").toUpperCase() === "UNAUTHORIZED";
    } catch {
      /* non-JSON error body */
    }
  }
  if (!unauthorized) return "ok";

  clearClientAdminToken();
  try {
    await fetch(`${ADMIN_BASE_PATH}/api/auth/logout`, { method: "POST" });
  } catch {
    /* ignore */
  }
  window.location.replace(`${ADMIN_BASE_PATH}/login/`);
  return "session-ended";
}
