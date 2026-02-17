import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canViewAllTenantData, canViewFinancials, canCreateSale } from "@/lib/permissions";
import { CreateSaleSchema } from "@/lib/validators";
import { z } from "zod";

const QuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  agentId: z.string().uuid().optional(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["FUTURE", "CLOSED", "CANCELED"]).optional(),
});

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const url = new URL(req.url);

  const parsed = QuerySchema.safeParse({
    from: url.searchParams.get("from") || undefined,
    to: url.searchParams.get("to") || undefined,
    agentId: url.searchParams.get("agentId") || undefined,
    day: url.searchParams.get("day") || undefined,
    status: url.searchParams.get("status") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const { from, to, agentId, day, status } = parsed.data;

  const forcedAgent =
    session.role === "AGENT"
      ? session.userId
      : agentId && canViewAllTenantData(session.role)
        ? agentId
        : undefined;

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    ...(forcedAgent ? { agentId: forcedAgent } : {}),
    ...(status ? { status } : {}),
  };

  if (day) {
    const d0 = new Date(`${day}T00:00:00.000Z`);
    const d1 = new Date(`${day}T23:59:59.999Z`);
    where.saleDate = { gte: d0, lte: d1 };
  } else if (from && to) {
    where.saleDate = { gte: new Date(from), lte: new Date(to) };
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { saleDate: "asc" },
    include: { contact: { select: { id: true, name: true, phone: true } } },
    take: 500,
  });

  const financialsAllowed = canViewFinancials(session.role);
  return NextResponse.json(sales.map((s) => (financialsAllowed ? s : { ...s, profitCents: null })));
}

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  if (!canCreateSale(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json();
  const parsed = CreateSaleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const data = parsed.data;

  const contact = await prisma.contact.findFirst({
    where: { id: data.contactId, tenantId: session.tenantId, deletedAt: null },
    select: { id: true },
  });
  if (!contact) return NextResponse.json({ error: "CONTACT_NOT_FOUND" }, { status: 404 });

  const agentId = session.role === "AGENT" ? session.userId : data.agentId ?? null;

  const sale = await prisma.sale.create({
    data: {
      tenantId: session.tenantId,
      contactId: data.contactId,
      agentId,
      status: data.status,
      profitCents: data.profitCents,
      saleDate: new Date(data.saleDate),
      title: data.title ?? null,
      notes: data.notes ?? null,
      createdById: session.userId,
      currency: "USD",
    },
  });

  return NextResponse.json(sale, { status: 201 });
}
