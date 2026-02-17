"use client";

import { useEffect, useMemo, useState } from "react";

type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  status: "NEW" | "IN_PROGRESS" | "QUALIFIED" | "CLOSED";
  photoUrl?: string | null;
};

export default function ContactsPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("");
  const [rows, setRows] = useState<Contact[]>([]);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    return p.toString();
  }, [q, status]);

  async function load() {
    setErr("");
    const res = await fetch(`/api/contacts?${qs}`);
    const json = await res.json();
    if (!res.ok) return setErr(json.error || "Error");
    setRows(json);
  }

  useEffect(() => {
    load();
  }, [qs]);

  async function uploadPhoto(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/uploads/contact-photo", { method: "POST", body: fd });
    const j = await res.json();
    if (res.ok) setPhotoUrl(j.url);
  }

  async function createContact(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/contacts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, photoUrl: photoUrl || null }) });
    if (res.ok) {
      setName("");
      setPhotoUrl("");
      load();
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Contactos</h2>
      <form onSubmit={createContact} className="bg-white border rounded-xl p-3 grid md:grid-cols-4 gap-2 items-end">
        <div><label className="text-xs">Nombre</label><input className="border rounded px-3 py-2 w-full" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><label className="text-xs">Subir foto</label><input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} /></div>
        <div className="text-xs text-gray-600">{photoUrl ? "Foto cargada" : "Sin foto"}</div>
        <button className="px-3 py-2 rounded bg-slate-800 text-white">Crear contacto</button>
      </form>

      <div className="flex gap-2">
        <input className="border rounded px-3 py-2 w-full" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="border rounded px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Nombre</th><th className="text-left p-3">Empresa</th><th className="text-left p-3">Teléfono</th><th className="text-left p-3">Estado</th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t"><td className="p-3 font-medium"><a className="underline" href={`/dashboard/contacts/`}>{c.name}</a></td><td className="p-3">{c.company ?? "-"}</td><td className="p-3">{c.phone ?? "-"}</td><td className="p-3">{c.status}</td></tr>
            ))}
            {rows.length === 0 && <tr><td className="p-3 text-gray-500" colSpan={4}>Sin resultados</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
