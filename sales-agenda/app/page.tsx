export default function Home() {
  return (
    <main className="p-6 max-w-xl">
      <h1 className="text-2xl font-semibold">Sales Agenda</h1>
      <p className="mt-2 text-gray-600">MVP funcional: Auth multiempresa, roles, contactos, calendario, ventas.</p>
      <div className="mt-6 flex gap-3">
        <a className="px-4 py-2 rounded bg-blue-600 text-white" href="/login">Login</a>
        <a className="px-4 py-2 rounded bg-gray-200" href="/dashboard">Dashboard</a>
      </div>
    </main>
  );
}
