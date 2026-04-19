import { NextRequest, NextResponse } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { getApiBaseUrl } from "@/lib/api";

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

  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: body.username, password: body.password }),
  });
  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: text || res.statusText },
      { status: res.status === 401 || res.status === 503 ? res.status : 502 },
    );
  }

  let parsed: { data?: { token?: string } };
  try {
    parsed = JSON.parse(text) as { data?: { token?: string } };
  } catch {
    return NextResponse.json({ error: "Bad response from API" }, { status: 502 });
  }
  const token = parsed.data?.token;
  if (!token) {
    return NextResponse.json({ error: "No token in response" }, { status: 502 });
  }

  const out = NextResponse.json({ ok: true, token });
  const secure = process.env.NODE_ENV === "production";
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
