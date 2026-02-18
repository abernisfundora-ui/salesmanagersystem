import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (!agentId || !from || !to) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const whereBase = {
    tenantId: session.tenantId,
    agentId,
    deletedAt: null,
  };

  const [appointments, closed, future] = await Promise.all([
    prisma.appointment.count({ where: { ...whereBase, startsAt: { gte: new Date(from), lte: new Date(to) }, status: { not: "CANCELED" } } }),
    prisma.sale.count({ where: { ...whereBase, saleDate: { gte: new Date(from), lte: new Date(to) }, status: "CLOSED" } }),
    prisma.sale.count({ where: { ...whereBase, saleDate: { gte: new Date(from), lte: new Date(to) }, status: "FUTURE" } }),
  ]);

  return NextResponse.json({
    S: appointments,
    Z: closed,
    CC: future,
    C: appointments ? Math.round((closed / appointments) * 100) : 0,
    X: appointments - closed,
    aggressivenessPct: appointments ? Math.round((future / appointments) * 100) : 0,
    closePct: appointments ? Math.round((closed / appointments) * 100) : 0,
    durationMinutes: 45,
  });
}
