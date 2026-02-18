"use client";
export function Tabs({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return <div className="flex gap-2">{options.map((x) => <button key={x} onClick={() => onChange(x)} className={`px-3 py-1 rounded-full ${value === x ? "bg-slate-800 text-white" : "bg-slate-200"}`}>{x}</button>)}</div>;
}
