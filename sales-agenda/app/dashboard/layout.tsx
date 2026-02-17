"use client";

import { useEffect, useState } from "react";

type Me = { role: string };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then(setMe).catch(() => setMe(null));
  }, []);

  const role = me?.role;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <a className="font-semibold" href="/dashboard">Dashboard</a>
          <nav className="flex gap-3 text-sm text-gray-700 flex-wrap">
            <a className="hover:underline" href="/dashboard/contacts">Contactos</a>
            <a className="hover:underline" href="/dashboard/calendar">Calendario</a>
            {role !== "SECRETARY" && <a className="hover:underline" href="/dashboard/agents">Equipo</a>}
            {(role === "REGIONAL_MANAGER" || role === "OWNER" || role === "ADMIN") && <a className="hover:underline" href="/dashboard/regional">Regional</a>}
            {role === "SECRETARY" && <a className="hover:underline" href="/dashboard/secretary">Secretaría</a>}
            {(role === "REGIONAL_MANAGER" || role === "MANAGER" || role === "OWNER" || role === "ADMIN") && <a className="hover:underline" href="/dashboard/followup">Follow-up</a>}
            {(role === "MANAGER" || role === "REGIONAL_MANAGER") && <a className="hover:underline" href="/dashboard/framework">Framework</a>}
            {role === "AGENT" && <a className="hover:underline" href="/dashboard/agent">Rubkley Today</a>}
          </nav>
          <div className="ml-auto">
            <form action="/api/auth/logout" method="post">
              <button className="text-sm px-3 py-2 rounded bg-gray-200">Logout</button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
