import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";

const Schema = z.object({
  title: z.string().min(2).max(200),
  notes: z.string().max(5000).optional(),
  assignedToId: z.string().uuid(),
  dueAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const member = await prisma.membership.findUnique({
    where: { tenantId_userId: { tenantId: session.tenantId, userId: parsed.data.assignedToId } },
  });
  if (!member) return NextResponse.json({ error: "INVALID_ASSIGNEE" }, { status: 400 });

  const task = await prisma.task.create({
    data: {
      tenantId: session.tenantId,
      title: parsed.data.title,
      notes: parsed.data.notes,
      assignedToId: parsed.data.assignedToId,
      createdById: session.userId,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
