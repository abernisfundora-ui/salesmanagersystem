import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { z } from "zod";

const UpdateSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELED", "NO_SHOW"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  const existing = await prisma.appointment.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { id: true, agentId: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (session.role === "AGENT" && existing.agentId !== session.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const agentId = session.role === "AGENT" ? session.userId : data.agentId !== undefined ? data.agentId : undefined;

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(agentId !== undefined ? { agentId } : {}),
      ...(data.startsAt ? { startsAt: new Date(data.startsAt) } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt ? new Date(data.endsAt) : null } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status ? { status: data.status } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  const existing = await prisma.appointment.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { id: true, agentId: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (session.role === "AGENT" && existing.agentId !== session.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.appointment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
