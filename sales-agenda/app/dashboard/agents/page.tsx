"use client";

import { useEffect, useState } from "react";

type Row = { agentId: string; name: string; email: string; closedSalesCount: number; profitCents: number | null };

export default function AgentsPage() {
  const [period, setPeriod] = useState("month");
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      const res = await fetch(`/api/metrics/agents?period=${period}`);
      const json = await res.json();
      if (!res.ok) return setErr(json.error || "FORBIDDEN (solo gerente)");
      setRows(json);
    })();
  }, [period]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">Mis agentes</h2>
        <select className="ml-auto border rounded px-3 py-2" value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="total">Total</option>
          <option value="day">Día</option>
          <option value="week">Semana</option>
          <option value="month">Mes</option>
          <option value="year">Año</option>
        </select>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-3">Agente</th>
              <th className="text-left p-3">Cerradas</th>
              <th className="text-left p-3">Ganancias</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.agentId} className="border-t">
                <td className="p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-gray-500">{r.email}</div>
                </td>
                <td className="p-3">{r.closedSalesCount}</td>
                <td className="p-3">
                  {r.profitCents === null ? <span className="text-gray-500">—</span> : `$${(r.profitCents / 100).toFixed(2)}`}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3 text-gray-500" colSpan={3}>Sin datos</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gray-600">Ganancias = solo ventas CERRADAS. Secretaría no ve ganancias.</p>
    </div>
  );
}
