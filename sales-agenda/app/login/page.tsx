"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (!res.ok) return setErr(json.error || "Error");

        if (json.needsTenantSelect) {
          sessionStorage.setItem("tenant_select_email", json.email);
          sessionStorage.setItem("tenant_select_memberships", JSON.stringify(json.memberships));
          r.push("/select-tenant");
        } else {
          r.push("/dashboard");
        }
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, tenantName }),
        });
        const json = await res.json();
        if (!res.ok) return setErr(json.error || "Error");
        r.push("/dashboard");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold">{mode === "login" ? "Login" : "Registro"}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Demo: manager@demo.com / 123456 (después de correr el seed)
        </p>

        <div className="mt-4 space-y-3">
          {mode === "register" && (
            <>
              <input className="w-full border rounded px-3 py-2" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
              <input className="w-full border rounded px-3 py-2" placeholder="Nombre de empresa" value={tenantName} onChange={(e) => setTenantName(e.target.value)} />
            </>
          )}

          <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          <button
            className="w-full rounded bg-blue-600 text-white py-2 disabled:opacity-50"
            onClick={submit}
            disabled={busy}
          >
            {busy ? "..." : "Continuar"}
          </button>

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <div className="text-sm text-gray-600">
            {mode === "login" ? (
              <button className="text-blue-600" onClick={() => setMode("register")}>Crear cuenta</button>
            ) : (
              <button className="text-blue-600" onClick={() => setMode("login")}>Ya tengo cuenta</button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
