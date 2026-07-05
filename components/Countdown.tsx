"use client";
import { AnimatePresence, motion } from "framer-motion";

export default function Countdown({ value }: { value: number | null }) {
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          key={value}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <span className="text-8xl font-black bg-gradient-to-r from-purple to-pink bg-clip-text text-transparent">
            {value === 0 ? "BAŞLA!" : value}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
