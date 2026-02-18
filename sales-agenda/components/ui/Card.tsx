"use client";
import { motion } from "framer-motion";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <motion.div whileHover={{ y: -2 }} className={`rounded-xl border border-white/20 bg-white/70 backdrop-blur p-4 shadow ${className}`}>{children}</motion.div>;
}
