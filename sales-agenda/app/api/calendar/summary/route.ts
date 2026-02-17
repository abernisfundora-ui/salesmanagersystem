import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { DateRangeSchema } from "@/lib/validators";
import { canViewAllTenantData } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const url = new URL(req.url);

  const parsed = DateRangeSchema.safeParse({
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
    agentId: url.searchParams.get("agentId") || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const { from, to, agentId } = parsed.data;

  const forcedAgent =
    session.role === "AGENT"
      ? session.userId
      : agentId && canViewAllTenantData(session.role)
        ? agentId
        : undefined;

  const tenantId = session.tenantId;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const agentFilter = forcedAgent ? `AND "agentId" = $4` : "";
  const params: any[] = forcedAgent ? [tenantId, fromDate, toDate, forcedAgent] : [tenantId, fromDate, toDate];

  const salesByDay = await prisma.$queryRawUnsafe<{ day: string; sales: number }[]>(
    `
    SELECT
      to_char(date_trunc('day', "saleDate"), 'YYYY-MM-DD') as day,
      COUNT(*)::int as sales
    FROM "Sale"
    WHERE "tenantId" = $1
      AND "deletedAt" IS NULL
      AND "saleDate" >= $2 AND "saleDate" <= $3
      AND status = 'CLOSED'
      ${agentFilter}
    GROUP BY 1
    ORDER BY 1 ASC
    `,
    ...params
  );

  const apptByDay = await prisma.$queryRawUnsafe<{ day: string; appointments: number }[]>(
    `
    SELECT
      to_char(date_trunc('day', "startsAt"), 'YYYY-MM-DD') as day,
      COUNT(*)::int as appointments
    FROM "Appointment"
    WHERE "tenantId" = $1
      AND "deletedAt" IS NULL
      AND "startsAt" >= $2 AND "startsAt" <= $3
      AND status != 'CANCELED'
      ${forcedAgent ? `AND "agentId" = $4` : ""}
    GROUP BY 1
    ORDER BY 1 ASC
    `,
    ...params
  );

  const map = new Map<string, { day: string; sales: number; appointments: number }>();
  for (const s of salesByDay) map.set(s.day, { day: s.day, sales: s.sales, appointments: 0 });
  for (const a of apptByDay) {
    const existing = map.get(a.day) ?? { day: a.day, sales: 0, appointments: 0 };
    existing.appointments = a.appointments;
    map.set(a.day, existing);
  }

  return NextResponse.json(Array.from(map.values()));
}
