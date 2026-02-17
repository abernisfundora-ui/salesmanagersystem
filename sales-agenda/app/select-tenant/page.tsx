"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type M = { tenantId: string; tenantName: string; role: string };

export default function SelectTenantPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [memberships, setMemberships] = useState<M[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const e = sessionStorage.getItem("tenant_select_email") || "";
    const m = sessionStorage.getItem("tenant_select_memberships");
    setEmail(e);
    setMemberships(m ? JSON.parse(m) : []);
  }, []);

  async function select(tenantId: string) {
    setErr("");
    const res = await fetch("/api/auth/select-tenant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, tenantId }),
    });
    const json = await res.json();
    if (!res.ok) return setErr(json.error || "Error");
    r.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold">Selecciona tu empresa</h2>
        <div className="mt-4 space-y-3">
          {memberships.map((m) => (
            <div key={m.tenantId} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{m.tenantName}</div>
                <div className="text-sm text-gray-500">Role: {m.role}</div>
              </div>
              <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={() => select(m.tenantId)}>
                Entrar
              </button>
            </div>
          ))}
          {memberships.length === 0 && <div className="text-sm text-gray-500">No hay empresas en memoria. Vuelve a login.</div>}
          {err && <p className="text-red-600 text-sm">{err}</p>}
        </div>
      </div>
    </main>
  );
}
