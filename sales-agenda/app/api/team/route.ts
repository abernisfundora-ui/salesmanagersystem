import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";
import { z } from "zod";

const CreateUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(6).max(200),
  role: z.enum(["MANAGER", "AGENT", "SECRETARY"]),
  reportsToUserId: z.string().uuid(),
});

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const role = url.searchParams.get("role");

  const members = await prisma.membership.findMany({
    where: {
      tenantId: session.tenantId,
      status: "ACTIVE",
      ...(role ? { role: role as any } : {}),
    },
    select: {
      role: true,
      status: true,
      createdAt: true,
      reportsToUserId: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      status: m.status,
      reportsToUserId: m.reportsToUserId,
      createdAt: m.createdAt,
    }))
  );
}

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, role, reportsToUserId } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  const supervisorMembership = await prisma.membership.findFirst({
    where: { tenantId: session.tenantId, userId: reportsToUserId, status: "ACTIVE" },
    select: { role: true },
  });
  if (!supervisorMembership) return NextResponse.json({ error: "INVALID_REPORTS_TO" }, { status: 400 });

  if (role === "MANAGER" && supervisorMembership.role !== "REGIONAL_MANAGER") {
    return NextResponse.json({ error: "MANAGER_MUST_REPORT_TO_REGIONAL" }, { status: 400 });
  }
  if ((role === "AGENT" || role === "SECRETARY") && supervisorMembership.role !== "MANAGER") {
    return NextResponse.json({ error: "STAFF_MUST_REPORT_TO_MANAGER" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { email, name, passwordHash },
    select: { id: true, email: true, name: true },
  });

  const membership = await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId: session.tenantId, userId: user.id } },
    update: { role: role as any, status: "ACTIVE", reportsToUserId },
    create: { tenantId: session.tenantId, userId: user.id, role: role as any, status: "ACTIVE", reportsToUserId },
    select: { role: true, status: true, reportsToUserId: true },
  });

  return NextResponse.json(
    {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: membership.role,
      status: membership.status,
      reportsToUserId: membership.reportsToUserId,
    },
    { status: 201 }
  );
}
