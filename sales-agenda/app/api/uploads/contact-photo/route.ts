import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSessionOrThrow } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  await getSessionOrThrow();
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "FILE_REQUIRED" }, { status: 400 });

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "BLOB_TOKEN_MISSING" }, { status: 500 });
  }

  const key = `contacts/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const uploaded = await put(key, file, { access: "public" });
  return NextResponse.json({ url: uploaded.url });
}
