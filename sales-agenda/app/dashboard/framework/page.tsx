"use client";
import { useEffect, useState } from "react";

export default function ManagerFrameworkPage() {
  const [stages, setStages] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/framework/stages").then((r) => r.json()).then(setStages);
    fetch("/api/framework/goals").then((r) => r.json()).then(setGoals);
  }, []);

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Framework (Read/Apply)</h1>
    <div className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold">Pipeline + Gates</h3>
      {stages.map((s) => <div key={s.id} className="text-sm mt-1">{s.order}. {s.name}</div>)}
    </div>
    <div className="rounded-xl border bg-white p-4">
      <h3 className="font-semibold">Goal progress del equipo (definiciones)</h3>
      {goals.map((g) => <div key={g.id} className="text-sm mt-1">{g.role} {g.period} {g.metricKey}: {g.targetValue}</div>)}
    </div>
  </div>;
}
