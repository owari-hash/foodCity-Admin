import { NextRequest, NextResponse } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { isHttpsRequest } from "@/lib/requestHttps";

export async function POST(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const secure = isHttpsRequest(req);
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
