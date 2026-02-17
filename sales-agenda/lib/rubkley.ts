import { prisma } from "@/lib/prisma";

export async function getActiveFramework(tenantId: string) {
  return prisma.rubkleyFramework.findFirst({
    where: { tenantId, isActive: true },
    include: { stages: { orderBy: { order: "asc" }, include: { gates: { orderBy: { order: "asc" } } } } },
  });
}

export async function evaluateGate(tenantId: string, contactId: string, rule: any) {
  if (rule?.type === "hasAppointment") {
    const c = await prisma.appointment.count({ where: { tenantId, contactId, deletedAt: null, status: { not: "CANCELED" } } });
    return rule.value ? c > 0 : c === 0;
  }
  if (rule?.type === "hasContactMethod") {
    const contact = await prisma.contact.findFirst({ where: { id: contactId, tenantId, deletedAt: null }, select: { phone: true, email: true } });
    return Boolean(contact?.phone || contact?.email);
  }
  if (rule?.type === "minKpi") {
    const today = startOfUtcDay(new Date());
    const row = await prisma.goalProgress.findFirst({
      where: { tenantId, userId: rule.userId ?? undefined, dateBucket: today, period: rule.period || "DAILY", metricKey: rule.metric },
    });
    return (row?.actualValue ?? 0) >= Number(rule.gte ?? 0);
  }
  if (rule?.type === "saleClosed") {
    const c = await prisma.sale.count({ where: { tenantId, contactId, deletedAt: null, status: "CLOSED", profitCents: { gt: 0 } } });
    return rule.value ? c > 0 : c === 0;
  }
  return true;
}

export function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
}

export async function computeDailyScore(tenantId: string, userId: string, role: string) {
  const framework = await prisma.rubkleyFramework.findFirst({ where: { tenantId, isActive: true } });
  if (!framework) return { score: 0, activityScore: 0, financialScore: 0 };

  const kpiSet = await prisma.kpiSet.findFirst({ where: { tenantId, frameworkId: framework.id, role: role as any, isActive: true }, include: { metrics: true } });
  const today = startOfUtcDay(new Date());
  const gps = await prisma.goalProgress.findMany({ where: { tenantId, userId, dateBucket: today, period: "DAILY" } });
  const gpMap = new Map(gps.map((g) => [g.metricKey, g.actualValue]));

  let activityScore = 0;
  for (const m of kpiSet?.metrics ?? []) activityScore += (gpMap.get(m.key) ?? 0) * m.weight;

  const goalsAchieved = gps.filter((g) => g.actualValue >= g.targetValue).length;
  const goalBonus = goalsAchieved * 5;
  const closedSales = await prisma.sale.count({ where: { tenantId, agentId: userId, status: "CLOSED", deletedAt: null, saleDate: { gte: today } } });
  const financialScore = role === "SECRETARY" ? 0 : closedSales * 10;
  const score = Math.round(activityScore + goalBonus + financialScore);

  return { score, activityScore: Math.round(activityScore + goalBonus), financialScore };
}
