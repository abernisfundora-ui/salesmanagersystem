"use client";
import { motion } from "framer-motion";

export function Modal({ open, children }: { open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 bg-black/40 grid place-items-center p-6"><motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-4 max-w-lg w-full">{children}</motion.div></div>;
}
