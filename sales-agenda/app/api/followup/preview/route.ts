import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { canManageTeam } from "@/lib/permissions";

const Schema = z.object({
  candidates: z.array(z.object({ id: z.string().uuid(), name: z.string() })),
  confirm: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getSessionOrThrow();
  if (!canManageTeam(session.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const previews = parsed.data.candidates.map((c) => ({
    contactId: c.id,
    name: c.name,
    message: `Hola ${c.name}, te contacto para dar seguimiento a tu proceso comercial.`,
  }));

  if (!parsed.data.confirm) {
    return NextResponse.json({ confirmRequired: true, previews });
  }

  await prisma.reminder.createMany({
    data: previews.map((p) => ({
      tenantId: session.tenantId,
      contactId: p.contactId,
      message: p.message,
      createdById: session.userId,
      channel: "placeholder",
    })),
  });

  return NextResponse.json({ ok: true, created: previews.length });
}
