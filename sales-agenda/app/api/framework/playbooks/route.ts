import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session } = await getFrameworkSession(false);
  return NextResponse.json(await prisma.playbook.findMany({ where: { tenantId: session.tenantId }, include: { plays: { orderBy: { order: "asc" } } } }));
}

export async function POST(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const b = await req.json();
    return NextResponse.json(await prisma.playbook.create({ data: { tenantId: session.tenantId, frameworkId: framework!.id, role: b.role, name: b.name, isActive: b.isActive ?? true } }), { status: 201 });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    if (b.playbookId && b.playName) {
      return NextResponse.json(await prisma.playDefinition.create({ data: { tenantId: session.tenantId, playbookId: b.playbookId, stageId: b.stageId ?? null, order: b.order ?? 0, name: b.playName, intent: b.intent ?? "", checklistJson: b.checklistJson ?? [], templatesJson: b.templatesJson ?? null } }));
    }
    await prisma.playbook.updateMany({ where: { id: b.id, tenantId: session.tenantId }, data: { name: b.name, role: b.role, isActive: b.isActive } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id") || "";
    await prisma.playbook.deleteMany({ where: { id, tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}
