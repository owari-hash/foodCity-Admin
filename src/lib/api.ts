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

/**
 * Public foodcity-front origin (no trailing slash). Used in admin for previews of
 * site-relative paths like `/images/…` that are served by the front app, not this admin host.
 */
export function getPublicFrontOrigin(): string {
  return (process.env.NEXT_PUBLIC_FRONT_ORIGIN ?? "http://bukhbatllc.mn")
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
