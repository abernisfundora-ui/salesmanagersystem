"use client";
import { useState } from "react";

export default function FollowupPage() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [preview, setPreview] = useState<any[]>([]);

  async function generate() {
    const res = await fetch("/api/followup/generate", { method: "POST" });
    const j = await res.json();
    setCandidates(j.candidates || []);
  }

  async function buildPreview(confirm = false) {
    const res = await fetch("/api/followup/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates, confirm }),
    });
    const j = await res.json();
    if (!confirm) setPreview(j.previews || []);
    else alert(`Recordatorios creados: ${j.created || 0}`);
  }

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Follow-up Masivo</h1>
    <button className="px-3 py-2 rounded bg-slate-800 text-white" onClick={generate}>Generar candidatos</button>
    {candidates.length > 0 && <button className="ml-2 px-3 py-2 rounded bg-slate-200" onClick={() => buildPreview(false)}>Preview</button>}
    <div className="space-y-2">{preview.map((p) => <div key={p.contactId} className="border rounded p-2 bg-white">{p.message}</div>)}</div>
    {preview.length > 0 && <div className="p-3 border rounded bg-amber-50">
      Vas a crear {preview.length} recordatorios / enviar {preview.length} mensajes.
      <button className="ml-3 px-3 py-1 rounded bg-emerald-700 text-white" onClick={() => buildPreview(true)}>Confirmar</button>
    </div>}
  </div>;
}
