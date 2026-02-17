import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";

export async function POST() {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const contacts = await prisma.contact.findMany({
    where: { tenantId: session.tenantId, deletedAt: null, status: { in: ["NEW", "IN_PROGRESS", "QUALIFIED"] } },
    take: 25,
    orderBy: { updatedAt: "asc" },
    select: { id: true, name: true, phone: true, email: true },
  });

  return NextResponse.json({ confirmRequired: true, candidates: contacts });
}
