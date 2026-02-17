import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session } = await getFrameworkSession(false);
  return NextResponse.json(await prisma.goalDefinition.findMany({ where: { tenantId: session.tenantId }, orderBy: [{ role: "asc" }, { period: "asc" }] }));
}

export async function POST(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const b = await req.json();
    return NextResponse.json(await prisma.goalDefinition.create({ data: { tenantId: session.tenantId, frameworkId: framework!.id, role: b.role, period: b.period, metricKey: b.metricKey, targetValue: Number(b.targetValue), isActive: b.isActive ?? true } }), { status: 201 });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    await prisma.goalDefinition.updateMany({ where: { id: b.id, tenantId: session.tenantId }, data: { targetValue: Number(b.targetValue), isActive: b.isActive } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id") || "";
    await prisma.goalDefinition.deleteMany({ where: { id, tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}
