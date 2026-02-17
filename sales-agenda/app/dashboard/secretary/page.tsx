"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SecretaryDashboard() {
  const router = useRouter();
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((me) => {
      if (me.role !== "SECRETARY") router.replace("/dashboard");
    });
  }, [router]);

  return <div className="space-y-4">
    <h1 className="text-2xl font-bold">Panel de Secretaría</h1>
    <div className="grid md:grid-cols-3 gap-3">
      <div className="p-4 border rounded bg-white">Notificaciones y tareas de hoy</div>
      <a className="p-4 border rounded bg-white" href="/dashboard/contacts">Acceso rápido: crear contacto</a>
      <a className="p-4 border rounded bg-white" href="/dashboard/calendar">Acceso rápido: agendar cita</a>
    </div>
    <p className="text-sm text-gray-600">Este panel no muestra métricas monetarias.</p>
  </div>;
}
