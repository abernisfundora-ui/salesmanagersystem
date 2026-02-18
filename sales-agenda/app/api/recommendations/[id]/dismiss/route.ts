import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionOrThrow();
  const event = await prisma.recommendationEvent.findFirst({ where: { id: params.id, tenantId: session.tenantId, userId: session.userId } });
  if (!event) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const status = req.url.includes("/accept") ? "ACCEPTED" : req.url.includes("/dismiss") ? "DISMISSED" : "COMPLETED";
  const updated = await prisma.recommendationEvent.update({ where: { id: event.id }, data: { status: status as any } });

  const action = updated.actionJson as any;
  if (status === "ACCEPTED" && action?.createTask) {
    await prisma.task.create({ data: { tenantId: session.tenantId, title: action.createTask.title || "Task from recommendation", notes: action.createTask.notes || null, assignedToId: session.userId, createdById: session.userId } });
  }

  return NextResponse.json(updated);
}
