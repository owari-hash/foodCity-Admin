/** Default origin (no `/api` suffix). Paths append `/api/v1/…`. */
const DEFAULT_API = "http://bukhbatllc.mn";

/**
 * Normalizes API origin: trims slashes, optionally downgrades https→http,
 * strips a trailing `/api` so callers can use `${base}/api/v1/…` without doubling.
 */
export function normalizeApiOrigin(raw: string): string {
  let url = raw.trim().replace(/\/+$/, "");
  if (process.env.NEXT_PUBLIC_API_ALLOW_HTTPS !== "1" && url.startsWith("https://")) {
    url = `http://${url.slice("https://".length)}`;
  }
  if (url.endsWith("/api")) {
    url = url.slice(0, -4).replace(/\/+$/, "");
  }
  return url;
}

/**
 * Base URL for foodcity-back (browser and server fallback). No trailing slash, no trailing `/api`.
 * By default, `https://` is rewritten to `http://` unless `NEXT_PUBLIC_API_ALLOW_HTTPS=1`.
 */
export function getApiBaseUrl(): string {
  return normalizeApiOrigin(process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API);
}

/**
 * Base URL for server-side fetches from the admin app (RSC, Route Handlers).
 * Prefer `API_INTERNAL_URL` or `SERVER_API_URL` on production when the public URL
 * is unreachable from the Node host (e.g. Docker network, loopback).
 */
export function getServerApiBaseUrl(): string {
  const internal =
    process.env.API_INTERNAL_URL?.trim() ||
    process.env.SERVER_API_URL?.trim() ||
    process.env.API_URL?.trim();
  if (internal) return normalizeApiOrigin(internal);
  return getApiBaseUrl();
}

/**
 * Public foodcity-front origin (no trailing slash). Used in admin for previews of
 * site-relative paths like `/images/…` that are served by the front app, not this admin host.
 */
export function getPublicFrontOrigin(): string {
  return (process.env.NEXT_PUBLIC_FRONT_ORIGIN ?? "http://localhost:3000")
    .trim()
    .replace(/\/$/, "");
}

/** See foodcity-front `getSocketBaseUrl` — Socket.io is not under `/api`. */
export function getSocketBaseUrl(): string {
  let u = getApiBaseUrl();
  if (u.endsWith("/api")) {
    u = u.slice(0, -4);
  }
  return u.replace(/\/$/, "");
}
