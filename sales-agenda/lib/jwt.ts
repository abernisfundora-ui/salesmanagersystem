import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
export const COOKIE_NAME = process.env.COOKIE_NAME || "saas_session";

export type JwtPayload = {
  userId: string;
  tenantId: string;
  role: "OWNER" | "ADMIN" | "REGIONAL_MANAGER" | "MANAGER" | "AGENT" | "SECRETARY";
};

export async function signSession(payload: JwtPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as JwtPayload;
}
