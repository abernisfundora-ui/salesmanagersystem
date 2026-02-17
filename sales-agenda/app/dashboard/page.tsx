import Link from "next/link";

export default function DashboardHome() {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Inicio</h2>
      <p className="text-gray-600">MVP listo. Usa el menú para probar.</p>
      <div className="flex gap-3">
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/dashboard/contacts">Contactos</Link>
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/dashboard/calendar">Calendario</Link>
        <Link className="px-3 py-2 rounded bg-blue-600 text-white" href="/dashboard/agents">Mis agentes</Link>
      </div>
    </div>
  );
}
