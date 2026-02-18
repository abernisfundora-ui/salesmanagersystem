"use client";

import { useEffect, useMemo, useState } from "react";

type DaySummary = { day: string; sales: number; appointments: number };

function ymd(d: Date) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function CalendarPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [data, setData] = useState<DaySummary[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [agentId, setAgentId] = useState<string>("");
  const [kpi, setKpi] = useState<any>(null);
  const [range, setRange] = useState<"week" | "month">("week");

  const { from, to, label } = useMemo(() => {
    const now = new Date();
    const first = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1, 0, 0, 0));
    const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset + 1, 0, 23, 59, 59));
    const label = first.toLocaleString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
    return { from: first.toISOString(), to: last.toISOString(), label };
  }, [monthOffset]);

  useEffect(() => {
    fetch(`/api/calendar/summary?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`).then((r) => r.json()).then(setData).catch(() => setData([]));
    fetch("/api/team?role=AGENT").then((r) => r.json()).then((j) => setAgents(j || []));
  }, [from, to]);

  useEffect(() => {
    if (!agentId || !selectedDay) return;
    const base = new Date(selectedDay + "T00:00:00.000Z");
    const fromDate = new Date(base);
    fromDate.setUTCDate(base.getUTCDate() - (range === "week" ? 6 : 29));
    fetch(`/api/metrics/agent-kpis?agentId=${agentId}&from=${fromDate.toISOString()}&to=${new Date(selectedDay + "T23:59:59.000Z").toISOString()}`)
      .then((r) => r.json())
      .then(setKpi);
  }, [agentId, selectedDay, range]);

  const map = useMemo(() => new Map(data.map((d) => [d.day, d])), [data]);

  const days = useMemo(() => {
    const start = new Date(from);
    const end = new Date(to);
    const out: string[] = [];
    const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 0, 0, 0));
    while (cur <= end) {
      out.push(ymd(cur));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return out;
  }, [from, to]);

  async function createTask() {
    if (!agentId || !selectedDay) return;
    await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Seguimiento KPI ${selectedDay}`, assignedToId: agentId }) });
    alert("Tarea creada");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold capitalize">Calendario — {label}</h2>
        <div className="ml-auto flex gap-2">
          <button className="px-3 py-2 rounded bg-gray-200" onClick={() => setMonthOffset((x) => x - 1)}>◀</button>
          <button className="px-3 py-2 rounded bg-gray-200" onClick={() => setMonthOffset(0)}>Hoy</button>
          <button className="px-3 py-2 rounded bg-gray-200" onClick={() => setMonthOffset((x) => x + 1)}>▶</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 grid grid-cols-7 gap-2">
          {days.map((d) => {
            const s = map.get(d);
            const dayNum = Number(d.slice(-2));
            return (
              <button key={d} onClick={() => setSelectedDay(d)} className={`bg-white border rounded-lg p-2 h-24 relative text-left ${selectedDay === d ? "ring-2 ring-sky-500" : ""}`}>
                <div className="text-sm text-gray-700">{dayNum}</div>
                <div className="absolute bottom-2 left-2 flex gap-1">
                  {s?.sales ? <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">{s.sales}</span> : null}
                  {s?.appointments ? <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">{s.appointments}</span> : null}
                </div>
              </button>
            );
          })}
        </div>
        <aside className="bg-white border rounded-lg p-3 space-y-2">
          <h3 className="font-semibold">KPI del día</h3>
          <select className="w-full border rounded p-2" value={agentId} onChange={(e) => setAgentId(e.target.value)}><option value="">Selecciona agente</option>{agents.map((a) => <option key={a.userId} value={a.userId}>{a.name}</option>)}</select>
          <div className="flex gap-2"><button className="px-2 py-1 rounded bg-gray-200" onClick={() => setRange("week")}>Semana</button><button className="px-2 py-1 rounded bg-gray-200" onClick={() => setRange("month")}>Mes</button></div>
          {kpi && <div className="text-sm space-y-1"><div>S:{kpi.S} Z:{kpi.Z} CC:{kpi.CC} C:{kpi.C} X:{kpi.X}</div><div>% agresividad: {kpi.aggressivenessPct}%</div><div>% cierre: {kpi.closePct}%</div><div>duración: {kpi.durationMinutes} min</div></div>}
          <button className="px-3 py-2 rounded bg-slate-800 text-white w-full" onClick={createTask}>Crear tarea/notificación</button>
        </aside>
      </div>

      <p className="text-sm text-gray-600">🟢 ventas CLOSED. 🟣 citas (no canceladas).</p>
    </div>
  );
}
