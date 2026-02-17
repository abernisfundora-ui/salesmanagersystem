"use client";
import { motion } from "framer-motion";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      className={`rounded-lg px-3 py-2 bg-white/10 border border-white/20 shadow backdrop-blur hover:shadow-lg transition ${props.className || ""}`}
      {...props}
    />
  );
}
