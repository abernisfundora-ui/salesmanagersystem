import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canAdvanceContactStage } from "@/lib/permissions";
import { evaluateGate } from "@/lib/rubkley";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  if (!canAdvanceContactStage(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const contact = await prisma.contact.findFirst({ where: { id: params.id, tenantId: session.tenantId, deletedAt: null }, include: { stage: true } });
  if (!contact) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  let toStage = body.toStageId
    ? await prisma.pipelineStage.findFirst({ where: { id: body.toStageId, tenantId: session.tenantId }, include: { gates: { orderBy: { order: "asc" } } } })
    : null;

  if (!toStage) {
    toStage = await prisma.pipelineStage.findFirst({
      where: { tenantId: session.tenantId, framework: { isActive: true }, order: { gt: contact.stage?.order ?? -1 } },
      orderBy: { order: "asc" },
      include: { gates: { orderBy: { order: "asc" } } },
    });
  }

  if (!toStage) return NextResponse.json({ error: "NO_NEXT_STAGE" }, { status: 400 });

  const gateResults = [] as any[];
  for (const g of toStage.gates) {
    const rule = typeof g.ruleJson === "object" && g.ruleJson ? { ...(g.ruleJson as any), userId: session.userId } : g.ruleJson;
    const pass = await evaluateGate(session.tenantId, contact.id, rule);
    gateResults.push({ id: g.id, message: g.message, pass, rule: g.ruleJson });
  }

  const blocked = gateResults.some((g) => !g.pass);
  if (blocked) return NextResponse.json({ error: "GATES_NOT_PASSED", stageId: contact.stageId, gates: gateResults }, { status: 400 });

  await prisma.contact.update({ where: { id: contact.id }, data: { stageId: toStage.id } });
  await prisma.contactStageHistory.create({
    data: {
      tenantId: session.tenantId,
      contactId: contact.id,
      fromStageId: contact.stageId,
      toStageId: toStage.id,
      changedByUserId: session.userId,
      reasonJson: body.reasonJson ?? null,
    },
  });

  return NextResponse.json({ contactId: contact.id, stageId: toStage.id, gates: gateResults });
}
