import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam, canViewFinancials } from "@/lib/permissions";

type Period = "total" | "day" | "week" | "month" | "year";

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const period = (url.searchParams.get("period") || "total") as Period;
  const range = periodToRangeUTC(period);

  const agents = await prisma.membership.findMany({
    where: { tenantId: session.tenantId, status: "ACTIVE", role: "AGENT" },
    select: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const agentIds = agents.map((a) => a.user.id);
  if (agentIds.length === 0) return NextResponse.json([]);

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    status: "CLOSED",
    agentId: { in: agentIds },
  };
  if (range) where.saleDate = { gte: range.from, lt: range.to };

  const grouped = await prisma.sale.groupBy({
    by: ["agentId"],
    where,
    _sum: { profitCents: true },
    _count: { _all: true },
  });

  const map = new Map<string, { profitCents: number; closedSalesCount: number }>();
  for (const g of grouped) {
    map.set(g.agentId ?? "", {
      profitCents: g._sum.profitCents ?? 0,
      closedSalesCount: g._count._all ?? 0,
    });
  }

  const financialsAllowed = canViewFinancials(session.role);

  const result = agents.map((a) => {
    const stats = map.get(a.user.id) ?? { profitCents: 0, closedSalesCount: 0 };
    return {
      agentId: a.user.id,
      name: a.user.name,
      email: a.user.email,
      closedSalesCount: stats.closedSalesCount,
      profitCents: financialsAllowed ? stats.profitCents : null,
    };
  });

  result.sort((x, y) => (y.profitCents ?? 0) - (x.profitCents ?? 0));
  return NextResponse.json(result);
}

function periodToRangeUTC(period: Period): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "total") return null;

  if (period === "day") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
    return { from, to };
  }

  if (period === "week") {
    const day = now.getUTCDay();
    const diffToMonday = (day + 6) % 7;
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday, 0, 0, 0));
    const to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 7, 0, 0, 0));
    return { from, to };
  }

  if (period === "month") {
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    return { from, to };
  }

  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0));
  const to = new Date(Date.UTC(now.getUTCFullYear() + 1, 0, 1, 0, 0, 0));
  return { from, to };
}
