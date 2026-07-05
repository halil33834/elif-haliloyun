"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Button from "./ui/Button";

const QUICK = ["👍", "😂", "😢", "🔥", "❤️", "Kolay gelsin!", "Tebrikler!", "Bir daha!"];

export default function Chat({
  messages,
  onSend
}: {
  messages: { from: string; text: string; at: number }[];
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="glass rounded-2xl p-4 mt-6">
      <div className="h-32 overflow-y-auto space-y-1 mb-3 text-sm">
        {messages.map((m, i) => (
          <motion.p key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            <span className="font-semibold text-pink-300">{m.from}:</span> {m.text}
          </motion.p>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => onSend(q)}
            className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
          >
            {q}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
        }}
        className="flex gap-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
          className="flex-1 bg-white/10 rounded-xl px-3 py-2 text-sm outline-none"
        />
        <Button type="submit" className="px-4 py-2 text-sm">
          Gönder
        </Button>
      </form>
    </div>
  );
}
