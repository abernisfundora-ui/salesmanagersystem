import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME } from "@/lib/jwt";

export function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const path = req.nextUrl.pathname;

  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/select-tenant") ||
    path.startsWith("/api/auth");

  if (!token && path.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (!token && !isPublic && path.startsWith("/api")) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
