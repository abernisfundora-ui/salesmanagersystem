import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canCreateSale } from "@/lib/permissions";
import { z } from "zod";

const UpdateSchema = z.object({
  agentId: z.string().uuid().nullable().optional(),
  status: z.enum(["FUTURE", "CLOSED", "CANCELED"]).optional(),
  profitCents: z.number().int().min(0).optional(),
  saleDate: z.string().datetime().optional(),
  title: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  if (!canCreateSale(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.sale.findFirst({
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

  const updated = await prisma.sale.update({
    where: { id },
    data: {
      ...(agentId !== undefined ? { agentId } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.profitCents !== undefined ? { profitCents: data.profitCents } : {}),
      ...(data.saleDate ? { saleDate: new Date(data.saleDate) } : {}),
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const id = params.id;

  if (!canCreateSale(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const existing = await prisma.sale.findFirst({
    where: { id, tenantId: session.tenantId, deletedAt: null },
    select: { id: true, agentId: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (session.role === "AGENT" && existing.agentId !== session.userId) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.sale.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
