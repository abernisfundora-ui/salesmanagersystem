import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canViewAllTenantData, canCreateAppointment } from "@/lib/permissions";
import { CreateAppointmentSchema } from "@/lib/validators";
import { z } from "zod";

const QuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  agentId: z.string().uuid().optional(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const url = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    agentId: url.searchParams.get("agentId") || undefined,
    day: url.searchParams.get("day") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const { from, to, agentId, day } = parsed.data;

  const forcedAgent =
    session.role === "AGENT"
      ? session.userId
      : agentId && canViewAllTenantData(session.role)
        ? agentId
        : undefined;

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    status: { not: "CANCELED" },
    ...(forcedAgent ? { agentId: forcedAgent } : {}),
    startsAt: { gte: new Date(from), lte: new Date(to) },
  };

  if (day) {
    const d0 = new Date(`${day}T00:00:00.000Z`);
    const d1 = new Date(`${day}T23:59:59.999Z`);
    where.startsAt = { gte: d0, lte: d1 };
  }

  const appts = await prisma.appointment.findMany({
    where,
    orderBy: { startsAt: "asc" },
    include: { contact: { select: { id: true, name: true, phone: true } } },
    take: 500,
  });

  return NextResponse.json(appts);
}

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  if (!canCreateAppointment(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateAppointmentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const contact = await prisma.contact.findFirst({
    where: { id: data.contactId, tenantId: session.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!contact) return NextResponse.json({ error: "CONTACT_NOT_FOUND" }, { status: 404 });

  const agentId = session.role === "AGENT" ? session.userId : data.agentId ?? null;

  const appt = await prisma.appointment.create({
    data: {
      tenantId: session.tenantId,
      contactId: data.contactId,
      agentId,
      startsAt: new Date(data.startsAt),
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      notes: data.notes ?? null,
      createdById: session.userId,
    },
  });

  return NextResponse.json(appt, { status: 201 });
}
