import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session } = await getFrameworkSession(false);
  return NextResponse.json(await prisma.trophyDefinition.findMany({ where: { tenantId: session.tenantId } }));
}

export async function POST(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const b = await req.json();
    return NextResponse.json(await prisma.trophyDefinition.create({ data: { tenantId: session.tenantId, frameworkId: framework!.id, name: b.name, description: b.description, icon: b.icon ?? null, ruleJson: b.ruleJson ?? {}, isActive: b.isActive ?? true } }), { status: 201 });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    await prisma.trophyDefinition.updateMany({ where: { id: b.id, tenantId: session.tenantId }, data: { name: b.name, description: b.description, icon: b.icon ?? null, ruleJson: b.ruleJson ?? {}, isActive: b.isActive } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id") || "";
    await prisma.trophyDefinition.deleteMany({ where: { id, tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}
