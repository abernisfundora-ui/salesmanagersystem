import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DateRangeSchema } from "@/lib/validators";
import { canViewFinancials, canViewAllTenantData } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const url = new URL(req.url);

  const parsed = DateRangeSchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    agentId: url.searchParams.get("agentId") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });

  const { from, to, agentId } = parsed.data;

  const forcedAgent =
    session.role === "AGENT"
      ? session.userId
      : agentId && canViewAllTenantData(session.role)
        ? agentId
        : undefined;

  const baseWhere: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    ...(forcedAgent ? { agentId: forcedAgent } : {}),
  };

  const [appointmentsCount, salesClosedCount, profitAgg, profitTodayAgg] = await Promise.all([
    prisma.appointment.count({
      where: {
        ...baseWhere,
        startsAt: { gte: new Date(from), lte: new Date(to) },
        status: { not: "CANCELED" },
      },
    }),
    prisma.sale.count({
      where: {
        ...baseWhere,
        saleDate: { gte: new Date(from), lte: new Date(to) },
        status: "CLOSED",
      },
    }),
    prisma.sale.aggregate({
      _sum: { profitCents: true },
      where: {
        ...baseWhere,
        saleDate: { gte: new Date(from), lte: new Date(to) },
        status: "CLOSED",
      },
    }),
    prisma.sale.aggregate({
      _sum: { profitCents: true },
      where: {
        ...baseWhere,
        saleDate: { gte: startOfTodayUTC(), lt: startOfTomorrowUTC() },
        status: "CLOSED",
      },
    }),
  ]);

  const conversionRate = appointmentsCount === 0 ? 0 : Math.round((salesClosedCount / appointmentsCount) * 100);
  const financialsAllowed = canViewFinancials(session.role);

  return NextResponse.json({
    totalSalesClosed: salesClosedCount,
    totalAppointments: appointmentsCount,
    conversionRate,
    profitMonthCents: financialsAllowed ? profitAgg._sum.profitCents ?? 0 : null,
    profitTodayCents: financialsAllowed ? profitTodayAgg._sum.profitCents ?? 0 : null,
  });
}

function startOfTodayUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}
function startOfTomorrowUTC() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0));
}
