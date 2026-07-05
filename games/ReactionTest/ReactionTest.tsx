"use client";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

export default function ReactionTest({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  if (!s) return null;

  function click() {
    if (s.phase !== "go") return;
    getSocket().emit("game:action", { type: "CLICK" });
  }

  const myTime = s.results?.[myId];

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">
        Round {s.roundOf}/{room.maxRounds}
      </p>
      <motion.button
        onClick={click}
        whileTap={{ scale: 0.95 }}
        className={`w-64 h-64 rounded-full flex items-center justify-center text-2xl font-black transition-colors ${
          s.phase === "go" ? "bg-green-500" : s.phase === "waiting" ? "bg-red-500/70" : "glass"
        }`}
      >
        {s.phase === "waiting" && "Bekle..."}
        {s.phase === "go" && (myTime ? `${myTime} ms ✔` : "ŞİMDİ BAS!")}
        {s.phase === "roundEnd" && "Sonraki round..."}
      </motion.button>
      <p className="mt-4 text-sm text-white/50">Renk yeşile dönünce hemen bas!</p>
    </div>
  );
}
