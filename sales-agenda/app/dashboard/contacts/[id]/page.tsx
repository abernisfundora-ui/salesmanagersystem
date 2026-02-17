"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ContactDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState("");

  async function load() {
    const [c, m] = await Promise.all([fetch(`/api/contacts/${params.id}`).then((r) => r.json()), fetch("/api/me").then((r) => r.json())]);
    setData(c);
    setMe(m);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function advance() {
    const res = await fetch(`/api/contacts/${params.id}/stage/advance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const j = await res.json();
    if (!res.ok) setErr(j.error || "No se pudo avanzar");
    await load();
  }

  if (!data) return <p>Cargando...</p>;

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">{data.name}</h1>
    <div className="bg-white border rounded-xl p-4">
      <p className="text-sm">Stage actual: <b>{data.stage?.name || "Sin stage"}</b></p>
      <div className="mt-2 space-y-1">
        {(data.stage?.gates || []).map((g: any) => <div key={g.id} className="text-sm">• {g.message}</div>)}
      </div>
      {me?.role !== "SECRETARY" && <button className="mt-3 px-3 py-2 rounded bg-slate-900 text-white" onClick={advance}>Advance</button>}
      {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
    </div>

    <div className="bg-white border rounded-xl p-4">
      <h3 className="font-semibold">Playbook contextual</h3>
      {(data.playbooks || []).flatMap((pb: any) => pb.plays).map((p: any) => (
        <div key={p.id} className="border rounded p-2 mt-2">
          <p className="font-medium">{p.name}</p>
          <p className="text-sm text-gray-600">{p.intent}</p>
        </div>
      ))}
    </div>

    <div className="bg-white border rounded-xl p-4">
      <h3 className="font-semibold">Timeline</h3>
      <ul className="text-sm space-y-1 mt-2">
        {(data.stageHistory || []).map((h: any) => <li key={h.id}>Stage: {h.fromStage?.name || "-"} → {h.toStage?.name}</li>)}
        {(data.appointments || []).slice(0, 5).map((a: any) => <li key={a.id}>Cita: {new Date(a.startsAt).toLocaleString()}</li>)}
        {(data.reminders || []).slice(0, 5).map((r: any) => <li key={r.id}>Reminder: {r.message}</li>)}
      </ul>
    </div>
  </div>;
}
