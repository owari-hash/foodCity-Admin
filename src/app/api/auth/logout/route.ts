import { NextResponse } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set({
    name: "fc_admin_token",
    value: "",
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: ADMIN_BASE_PATH,
    maxAge: 0,
  });
  return res;
}
