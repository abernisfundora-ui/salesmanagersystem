import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";

export async function DELETE(_: Request, { params }: { params: { userId: string } }) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const userId = params.userId;

  await prisma.membership.delete({
    where: { tenantId_userId: { tenantId: session.tenantId, userId } },
  });

  await prisma.contact.updateMany({
    where: { tenantId: session.tenantId, assignedAgentId: userId },
    data: { assignedAgentId: null },
  });
  await prisma.appointment.updateMany({
    where: { tenantId: session.tenantId, agentId: userId },
    data: { agentId: null },
  });
  await prisma.sale.updateMany({
    where: { tenantId: session.tenantId, agentId: userId },
    data: { agentId: null },
  });

  return NextResponse.json({ ok: true });
}
