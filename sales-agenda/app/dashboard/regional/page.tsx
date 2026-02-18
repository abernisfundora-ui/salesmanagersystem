"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/Tabs";

export default function RegionalDashboard() {
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tab, setTab] = useState("Overview");
  const [stages, setStages] = useState<any[]>([]);
  const [kpiSets, setKpiSets] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [trophies, setTrophies] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((me) => {
      if (!["REGIONAL_MANAGER", "OWNER", "ADMIN"].includes(me.role)) router.replace("/dashboard");
    });
    const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString();
    const to = new Date().toISOString();
    fetch(`/api/metrics/summary?from=${from}&to=${to}`).then((r) => r.json()).then(setSummary);
    fetch("/api/metrics/agents?period=month").then((r) => r.json()).then(setAgents);
    fetch("/api/framework/stages").then((r) => r.json()).then(setStages);
    fetch("/api/framework/kpisets").then((r) => r.json()).then(setKpiSets);
    fetch("/api/framework/goals").then((r) => r.json()).then(setGoals);
    fetch("/api/framework/trophies").then((r) => r.json()).then(setTrophies);
    fetch("/api/framework/recommendation-rules").then((r) => r.json()).then(setRules);
  }, [router]);

  return <div className="space-y-4">
    <Tabs options={["Overview", "Framework"]} value={tab} onChange={setTab} />
    {tab === "Overview" ? <>
      <h1 className="text-2xl font-bold">Executive Overview</h1>
      <div className="grid md:grid-cols-4 gap-3">
        <div className="p-4 rounded border bg-white">Ventas cerradas: {summary?.totalSalesClosed ?? "-"}</div>
        <div className="p-4 rounded border bg-white">Citas: {summary?.totalAppointments ?? "-"}</div>
        <div className="p-4 rounded border bg-white">Conversión: {summary?.conversionRate ?? "-"}%</div>
        <div className="p-4 rounded border bg-white">Profit: {summary?.profitMonthCents != null ? `$${(summary.profitMonthCents / 100).toFixed(2)}` : "Oculto"}</div>
      </div>
      <div className="rounded border bg-white">{agents.map((a) => <div key={a.agentId} className="p-3 border-b flex justify-between"><span>{a.name}</span><span>{a.closedSalesCount} cierres</span></div>)}</div>
    </> : <>
      <h2 className="text-xl font-semibold">Framework</h2>
      <section className="rounded-xl border bg-white p-3"><h3 className="font-semibold">A) Pipeline Builder</h3><div className="mt-2 space-y-2">{stages.map((s) => <div key={s.id} className="border rounded p-2"><b>{s.order}. {s.name}</b><div className="text-xs">gates: {(s.gates || []).length}</div></div>)}</div></section>
      <section className="rounded-xl border bg-white p-3"><h3 className="font-semibold">B) KPI Sets</h3><p className="text-sm">Total: {kpiSets.length}</p></section>
      <section className="rounded-xl border bg-white p-3"><h3 className="font-semibold">C) Goals</h3><p className="text-sm">Total: {goals.length}</p></section>
      <section className="rounded-xl border bg-white p-3"><h3 className="font-semibold">D) Trophies</h3><p className="text-sm">Total: {trophies.length}</p></section>
      <section className="rounded-xl border bg-white p-3"><h3 className="font-semibold">E) Recommendation Rules</h3><p className="text-sm">Total: {rules.length}</p></section>
    </>}
  </div>;
}
