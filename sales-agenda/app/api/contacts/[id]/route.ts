import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { z } from "zod";


export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  const contact = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    include: {
      stage: { include: { gates: { orderBy: { order: "asc" } } } },
      appointments: { where: { tenantId: session.tenantId, deletedAt: null }, orderBy: { startsAt: "desc" }, take: 20 },
      sales: { where: { tenantId: session.tenantId, deletedAt: null }, orderBy: { saleDate: "desc" }, take: 20 },
      reminders: { where: { tenantId: session.tenantId }, orderBy: { createdAt: "desc" }, take: 20 },
      stageHistory: { where: { tenantId: session.tenantId }, orderBy: { changedAt: "desc" }, take: 30, include: { fromStage: true, toStage: true } },
    },
  });
  if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const playbooks = await prisma.playbook.findMany({
    where: { tenantId: session.tenantId, role: session.role as any, isActive: true },
    include: { plays: { where: { OR: [{ stageId: null }, { stageId: contact.stageId }] }, orderBy: { order: "asc" } } },
  });

  const safeSales = session.role === "SECRETARY" ? contact.sales.map((s: any) => ({ ...s, profitCents: null })) : contact.sales;
  return NextResponse.json({ ...contact, sales: safeSales, playbooks });
}

const UpdateContactSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  company: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(400).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "QUALIFIED", "CLOSED"]).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  const existing = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { id: true, assignedAgentId: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (session.role === "AGENT" && existing.assignedAgentId !== session.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = UpdateContactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const assignedAgentId =
    session.role === "AGENT"
      ? session.userId
      : data.assignedAgentId !== undefined
        ? data.assignedAgentId
        : undefined;

  const updated = await prisma.contact.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.company !== undefined ? { company: data.company } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(assignedAgentId !== undefined ? { assignedAgentId } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  const existing = await prisma.contact.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { id: true, assignedAgentId: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (session.role === "AGENT" && existing.assignedAgentId !== session.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
