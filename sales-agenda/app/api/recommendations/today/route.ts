import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { startOfUtcDay } from "@/lib/rubkley";

function passCondition(cond: any, ctx: any) {
  if (cond?.type === "pendingTasksGte") return ctx.pendingTasks >= Number(cond.value ?? 1);
  if (cond?.type === "pendingRemindersGte") return ctx.pendingReminders >= Number(cond.value ?? 1);
  if (cond?.type === "closedSalesEq") return ctx.closedSales === Number(cond.value ?? 0);
  if (cond?.type === "goalMetricBelow") return (ctx.goalMap.get(cond.metricKey) ?? 0) < Number(cond.value ?? 1);
  return true;
}

export async function GET() {
  const session = await getSessionOrThrow();
  const today = startOfUtcDay(new Date());

  const [rules, pendingTasks, pendingReminders, closedSales, goals] = await Promise.all([
    prisma.recommendationRule.findMany({ where: { tenantId: session.tenantId, role: session.role as any, isActive: true }, orderBy: { priority: "asc" } }),
    prisma.task.count({ where: { tenantId: session.tenantId, assignedToId: session.userId } }),
    prisma.reminder.count({ where: { tenantId: session.tenantId } }),
    prisma.sale.count({ where: { tenantId: session.tenantId, agentId: session.userId, status: "CLOSED", deletedAt: null, saleDate: { gte: today } } }),
    prisma.goalProgress.findMany({ where: { tenantId: session.tenantId, userId: session.userId, dateBucket: today, period: "DAILY" } }),
  ]);

  const goalMap = new Map(goals.map((g) => [g.metricKey, g.actualValue]));
  const ctx = { pendingTasks, pendingReminders, closedSales, goalMap };
  const selected = rules.filter((r) => passCondition(r.conditionJson, ctx)).slice(0, 3);

  const events = await Promise.all(selected.map((r) => prisma.recommendationEvent.create({ data: { tenantId: session.tenantId, userId: session.userId, dateBucket: today, ruleId: r.id, actionJson: r.actionJson, status: "SHOWN" } })));
  return NextResponse.json(events);
}
