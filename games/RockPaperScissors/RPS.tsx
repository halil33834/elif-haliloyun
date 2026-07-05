"use client";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

const OPTIONS = [
  { key: "rock", emoji: "🪨", label: "Taş" },
  { key: "paper", emoji: "📄", label: "Kağıt" },
  { key: "scissors", emoji: "✂️", label: "Makas" }
];

export default function RockPaperScissors({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  if (!s) return null;
  const opponent = room.players.find((p) => p.id !== myId);
  const chosen = s.choices && s.choices[myId];

  function choose(key: string) {
    if (chosen) return;
    getSocket().emit("game:action", { type: "CHOOSE", value: key });
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">
        Round {s.roundOf}/{room.maxRounds}
      </p>
      {s.lastRound && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 text-center glass rounded-2xl px-4 py-2">
          <p className="text-2xl">
            {OPTIONS.find((o) => o.key === s.lastRound.a)?.emoji} vs {OPTIONS.find((o) => o.key === s.lastRound.b)?.emoji}
          </p>
          <p className="text-sm text-white/70">
            {s.lastRound.winnerId === null
              ? "Berabere!"
              : s.lastRound.winnerId === myId
              ? "Bu raundu kazandın!"
              : "Bu raundu kaybettin."}
          </p>
        </motion.div>
      )}
      <div className="flex gap-4">
        {OPTIONS.map((o) => (
          <motion.button
            key={o.key}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => choose(o.key)}
            disabled={!!chosen}
            className={`w-20 h-20 rounded-2xl text-4xl flex items-center justify-center ${
              chosen === o.key ? "bg-purple-600" : "glass"
            }`}
          >
            {o.emoji}
          </motion.button>
        ))}
      </div>
      <p className="mt-4 text-sm text-white/50">{chosen ? "Rakip bekleniyor..." : "Bir seçim yap!"}</p>
    </div>
  );
}
