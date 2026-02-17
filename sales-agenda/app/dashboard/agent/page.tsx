"use client";

import { useEffect, useState } from "react";

export default function AgentDashboardPage() {
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const res = await fetch("/api/recommendations/today");
    const j = await res.json();
    setItems(j || []);
  }

  useEffect(() => { load(); }, []);

  async function track(id: string, action: "accept" | "dismiss" | "complete") {
    await fetch(`/api/recommendations/${id}/${action}`, { method: "POST" });
    load();
  }

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Rubkley Today Plan</h1>
    <div className="grid gap-3">
      {items.map((it) => <div key={it.id} className="rounded-xl border bg-white p-4">
        <p className="font-medium">Regla #{it.ruleId.slice(0, 8)}</p>
        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">{JSON.stringify(it.actionJson, null, 2)}</pre>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1 rounded bg-emerald-700 text-white" onClick={() => track(it.id, "accept")}>Accept</button>
          <button className="px-3 py-1 rounded bg-slate-300" onClick={() => track(it.id, "dismiss")}>Dismiss</button>
          <button className="px-3 py-1 rounded bg-sky-700 text-white" onClick={() => track(it.id, "complete")}>Complete</button>
        </div>
      </div>)}
    </div>
  </div>;
}
