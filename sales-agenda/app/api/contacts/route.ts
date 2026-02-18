import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrThrow } from "@/lib/auth";
import { z } from "zod";

const ContactQuerySchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "QUALIFIED", "CLOSED"]).optional(),
  q: z.string().max(200).optional(),
  assigned: z.string().uuid().optional(),
});

const CreateContactSchema = z.object({
  name: z.string().min(2).max(200),
  company: z.string().max(200).nullable().optional(),
  phone: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  address: z.string().max(400).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "QUALIFIED", "CLOSED"]).optional(),
  assignedAgentId: z.string().uuid().nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
});

export async function GET(req: Request) {
  const session = await getSessionOrThrow();
  const url = new URL(req.url);

  const parsed = ContactQuerySchema.safeParse({
    status: url.searchParams.get("status") || undefined,
    q: url.searchParams.get("q") || undefined,
    assigned: url.searchParams.get("assigned") || undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });

  const { status, q, assigned } = parsed.data;

  const agentScope = session.role === "AGENT" ? { assignedAgentId: session.userId } : {};

  const where: any = {
    tenantId: session.tenantId,
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(assigned ? { assignedAgentId: assigned } : {}),
    ...agentScope,
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await getSessionOrThrow();

  const body = await req.json();
  const parsed = CreateContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "BAD_REQUEST", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const assignedAgentId = session.role === "AGENT" ? session.userId : data.assignedAgentId ?? null;

  const created = await prisma.contact.create({
    data: {
      tenantId: session.tenantId,
      createdById: session.userId,
      assignedAgentId,
      name: data.name,
      company: data.company ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      address: data.address ?? null,
      notes: data.notes ?? null,
      status: data.status ?? "NEW",
      photoUrl: data.photoUrl ?? null,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
