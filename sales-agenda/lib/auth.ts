import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type JwtPayload } from "@/lib/jwt";

export type SessionUser = JwtPayload;

export async function getSessionOrThrow(): Promise<SessionUser> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) throw new Error("UNAUTHORIZED");
  try {
    return await verifySession(token);
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
