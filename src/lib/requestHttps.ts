import type { NextRequest } from "next/server";

/** Use for cookie `secure` behind reverse proxies (e.g. nginx + http:// origin). */
export function isHttpsRequest(req: NextRequest): boolean {
  const fwd = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (fwd === "https") return true;
  if (fwd === "http") return false;
  return req.nextUrl.protocol === "https:";
}
