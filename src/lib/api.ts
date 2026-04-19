/** Default matches a backend served over plain HTTP (no TLS on API). */
const DEFAULT_API = "http://bukhbatllc.mn";

/**
 * Base URL for foodcity-back. By default, `https://` in env is rewritten to `http://`
 * unless `NEXT_PUBLIC_API_ALLOW_HTTPS=1` (use when API is really on HTTPS).
 *
 * NOTE: All fetch calls already append `/api/v1/…`, so the base URL must NOT
 * end with `/api`. If it does (e.g. from a reverse‐proxy env), we strip it.
 */
export function getApiBaseUrl(): string {
  let url = (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API).trim();
  if (process.env.NEXT_PUBLIC_API_ALLOW_HTTPS !== "1" && url.startsWith("https://")) {
    url = `http://${url.slice("https://".length)}`;
  }
  url = url.replace(/\/+$/, "");
  // Strip trailing /api — callers already prepend /api/v1/…
  if (url.endsWith("/api")) {
    url = url.slice(0, -4);
  }
  return url;
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
