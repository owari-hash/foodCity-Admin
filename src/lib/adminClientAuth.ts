const STORAGE_KEY = "fc_admin_jwt";

export function readClientAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeClientAdminToken(token: string): void {
  sessionStorage.setItem(STORAGE_KEY, token);
}

export function clearClientAdminToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Browser-only: cross-origin API calls cannot send the admin httpOnly cookie. */
export function withClientAdminAuth(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers ?? undefined);
  const t = readClientAdminToken();
  if (t) headers.set("Authorization", `Bearer ${t}`);
  return { ...init, headers };
}
