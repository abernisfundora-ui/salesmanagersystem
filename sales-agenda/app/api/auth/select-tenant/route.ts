import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, COOKIE_NAME } from "@/lib/jwt";
import { z } from "zod";

const Schema = z.object({ email: z.string().email(), tenantId: z.string().uuid() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const { email, tenantId } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const membership = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId, userId: user.id } },
    select: { role: true, status: true },
  });

  if (!membership || membership.status !== "ACTIVE") return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const jwt = await signSession({ userId: user.id, tenantId, role: membership.role as any });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, jwt, cookieOpts());
  return res;
}

function cookieOpts() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
