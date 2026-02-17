import { z } from "zod";

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  agentId: z.string().uuid().optional(),
});

export const CreateAppointmentSchema = z.object({
  contactId: z.string().uuid(),
  agentId: z.string().uuid().nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const CreateSaleSchema = z.object({
  contactId: z.string().uuid(),
  agentId: z.string().uuid().nullable().optional(),
  status: z.enum(["FUTURE", "CLOSED", "CANCELED"]).default("FUTURE"),
  profitCents: z.number().int().min(0),
  saleDate: z.string().datetime(),
  title: z.string().max(200).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});
