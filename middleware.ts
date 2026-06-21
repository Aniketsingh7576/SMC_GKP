import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose/jwt/verify";
const SESSION_COOKIE = "medvault_session";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const login = req.nextUrl.pathname === "/login";
  let valid = false;
  if (token) try { await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET || "development-only-secret-change-me")); valid = true; } catch {}
  if (!valid && !login) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(req.nextUrl.pathname)}`, req.url));
  if (valid && login) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
}
export const config = { matcher: ["/dashboard/:path*", "/patients/:path*", "/reports/:path*", "/analytics/:path*", "/activity/:path*", "/settings/:path*", "/login"] };
