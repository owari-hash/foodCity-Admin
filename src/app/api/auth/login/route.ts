import { NextRequest, NextResponse } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { getBackendUpstreamUrlCandidates } from "@/lib/api";
import { isHttpsRequest } from "@/lib/requestHttps";

const ADMIN_LOGIN_PATH = "/api/v1/admin/auth/login";

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = (await req.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "username and password required" }, { status: 400 });
  }

  const payload = JSON.stringify({ username: body.username, password: body.password });
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    cache: "no-store",
  };

  let res: Response | undefined;
  let text = "";
  let attemptedUrl = "";
  const urls = getBackendUpstreamUrlCandidates(ADMIN_LOGIN_PATH);

  for (let i = 0; i < urls.length; i++) {
    const upstreamUrl = urls[i]!;
    attemptedUrl = upstreamUrl;
    try {
      const r = await fetch(upstreamUrl, init);
      const t = await r.text();
      res = r;
      text = t;
      if (r.ok) break;
      if (r.status === 401 || r.status === 400) break;
      if (i < urls.length - 1) continue;
    } catch {
      if (i < urls.length - 1) {
        res = undefined;
        text = "";
        continue;
      }
      res = undefined;
      text = "";
    }
  }

  if (!res) {
    return NextResponse.json(
      {
        error: "Cannot reach foodcity-back from this server.",
        code: "API_UNREACHABLE",
        attemptedUrls: urls,
        hint: "Set API_INTERNAL_URL=http://127.0.0.1:4000 (or your Docker service host) so admin can reach the API without hairpin NAT.",
      },
      { status: 503 },
    );
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        error: text || res.statusText,
        attemptedUrl,
        ...(urls.length > 1 ? { triedUrls: urls } : {}),
      },
      { status: res.status === 401 || res.status === 503 ? res.status : 502 },
    );
  }

  let parsed: { data?: { token?: string } };
  try {
    parsed = JSON.parse(text) as { data?: { token?: string } };
  } catch {
    return NextResponse.json({ error: "Bad response from API", attemptedUrl }, { status: 502 });
  }
  const token = parsed.data?.token;
  if (!token) {
    return NextResponse.json({ error: "No token in response", attemptedUrl }, { status: 502 });
  }

  const out = NextResponse.json({ ok: true, token });
  const secure = isHttpsRequest(req);
  out.cookies.set({
    name: "fc_admin_token",
    value: token,
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: ADMIN_BASE_PATH,
    maxAge: 60 * 60 * 24 * 7,
  });
  return out;
}
