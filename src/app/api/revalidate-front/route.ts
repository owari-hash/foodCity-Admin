import { NextResponse } from "next/server";

/**
 * Server-only: triggers the public site to drop cached CMS fetches.
 * Called from the site-content UI after a successful save (no secret in the browser).
 */
export async function POST() {
  const origin = (
    process.env.FRONT_ORIGIN ??
    process.env.NEXT_PUBLIC_FRONT_ORIGIN ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  try {
    const res = await fetch(`${origin}/api/revalidate-site`, {
      method: "POST",
      headers: { "x-revalidate-secret": secret },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { ok: false, error: text || res.statusText },
        { status: 502 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
