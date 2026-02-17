export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="text-xs px-2 py-1 rounded-full bg-slate-900 text-white">{children}</span>;
}
