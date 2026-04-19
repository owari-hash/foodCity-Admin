import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_BASE_PATH } from "@/lib/adminBasePath";
import { verifyAdminJwt } from "@/lib/verifyAdminJwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rootAdminLike =
    pathname === "/login" ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/site-content") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/sales-ads") ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/chat");
  if (rootAdminLike) {
    const u = request.nextUrl.clone();
    u.pathname = `${ADMIN_BASE_PATH}${pathname}`;
    return NextResponse.redirect(u);
  }
  if (!pathname.startsWith(ADMIN_BASE_PATH)) {
    return NextResponse.next();
  }
  if (/\.(?:ico|png|jpg|jpeg|gif|webp|svg|txt|woff2?)$/i.test(pathname)) {
    return NextResponse.next();
  }
  if (pathname.startsWith(`${ADMIN_BASE_PATH}/_next/`)) {
    return NextResponse.next();
  }

  const rel = pathname.slice(ADMIN_BASE_PATH.length) || "/";
  const norm = rel.replace(/\/$/, "") || "/";

  if (norm === "/login") {
    const token = request.cookies.get("fc_admin_token")?.value;
    if (token && (await verifyAdminJwt(token))) {
      return NextResponse.redirect(new URL(`${ADMIN_BASE_PATH}/dashboard/`, request.url));
    }
    return NextResponse.next();
  }

  if (norm.startsWith("/api/auth/login") || norm.startsWith("/api/auth/logout")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fc_admin_token")?.value;
  if (!token || !(await verifyAdminJwt(token))) {
    const u = request.nextUrl.clone();
    u.pathname = `${ADMIN_BASE_PATH}/login/`;
    u.search = "";
    return NextResponse.redirect(u);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
