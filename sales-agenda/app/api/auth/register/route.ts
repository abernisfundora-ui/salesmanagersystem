import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signSession, COOKIE_NAME } from "@/lib/jwt";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  tenantName: z.string().min(2).max(120),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, tenantName } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return NextResponse.json({ error: "EMAIL_IN_USE" }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 10);

  const tenant = await prisma.tenant.create({
    data: {
      name: tenantName,
      slug: tenantName.toLowerCase().replace(/\s+/g, "-") + "-" + Math.random().toString(16).slice(2, 6),
    },
    select: { id: true },
  });

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
    select: { id: true },
  });

  await prisma.membership.create({
    data: { tenantId: tenant.id, userId: user.id, role: "MANAGER", status: "ACTIVE" },
  });

  const jwt = await signSession({ userId: user.id, tenantId: tenant.id, role: "MANAGER" });

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
