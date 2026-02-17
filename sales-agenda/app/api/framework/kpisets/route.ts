import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getFrameworkSession } from "@/lib/framework-api";

export async function GET() {
  const { session } = await getFrameworkSession(false);
  return NextResponse.json(await prisma.kpiSet.findMany({ where: { tenantId: session.tenantId }, include: { metrics: true } }));
}

export async function POST(req: Request) {
  try {
    const { session, framework } = await getFrameworkSession(true);
    const b = await req.json();
    return NextResponse.json(await prisma.kpiSet.create({ data: { tenantId: session.tenantId, frameworkId: framework!.id, role: b.role, name: b.name, isActive: b.isActive ?? true } }), { status: 201 });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function PUT(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const b = await req.json();
    if (b.kpiSetId && b.metricKey) {
      return NextResponse.json(await prisma.kpiMetricDefinition.create({ data: { tenantId: session.tenantId, kpiSetId: b.kpiSetId, key: b.metricKey, name: b.name, unit: b.unit ?? "count", weight: Number(b.weight ?? 1), defaultTarget: b.defaultTarget ?? null } }));
    }
    await prisma.kpiSet.updateMany({ where: { id: b.id, tenantId: session.tenantId }, data: { name: b.name, role: b.role, isActive: b.isActive } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}

export async function DELETE(req: Request) {
  try {
    const { session } = await getFrameworkSession(true);
    const id = new URL(req.url).searchParams.get("id") || "";
    await prisma.kpiSet.deleteMany({ where: { id, tenantId: session.tenantId } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }); }
}
