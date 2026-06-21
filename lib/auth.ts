import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "@/types";

export const SESSION_COOKIE = "medvault_session";
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || "development-only-secret-change-me");

export async function signToken(user: SessionUser) {
  return new SignJWT({ ...user }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(secret());
}
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try { return (await jwtVerify(token, secret())).payload as unknown as SessionUser; } catch { return null; }
}
export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifyToken(token) : null;
}
export async function requireSession(roles?: Role[]) {
  const user = await getSession();
  if (!user) throw new Error("UNAUTHORIZED");
  if (roles && !roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
