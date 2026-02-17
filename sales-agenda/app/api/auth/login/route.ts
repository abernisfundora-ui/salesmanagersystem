import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, COOKIE_NAME } from "@/lib/jwt";
import { z } from "zod";

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      passwordHash: true,
      memberships: {
        where: { status: "ACTIVE" },
        select: { tenantId: true, role: true, tenant: { select: { name: true } } },
      },
    },
  });

  if (!user?.passwordHash) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });

  if (user.memberships.length === 1) {
    const m = user.memberships[0];
    const jwt = await signSession({ userId: user.id, tenantId: m.tenantId, role: m.role as any });

    const res = NextResponse.json({ ok: true, needsTenantSelect: false });
    res.cookies.set(COOKIE_NAME, jwt, cookieOpts());
    return res;
  }

  return NextResponse.json({
    ok: true,
    needsTenantSelect: true,
    memberships: user.memberships.map((m) => ({
      tenantId: m.tenantId,
      tenantName: m.tenant.name,
      role: m.role,
    })),
    email,
  });
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
