"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

export default function FastClick({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  const [remaining, setRemaining] = useState(5);

  useEffect(() => {
    if (s?.phase !== "go" || !s.endsAt) return;
    const iv = setInterval(() => {
      const left = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
      setRemaining(left);
    }, 200);
    return () => clearInterval(iv);
  }, [s?.phase, s?.endsAt]);

  if (!s) return null;

  function click() {
    if (s.phase !== "go") return;
    getSocket().emit("game:action", { type: "CLICK" });
  }

  return (
    <div className="flex flex-col items-center">
      {s.phase === "countdown" && <p className="text-2xl font-bold mb-4">Hazırlan!</p>}
      {s.phase === "go" && <p className="text-2xl font-bold mb-4">{remaining} saniye kaldı!</p>}
      {s.phase === "ended" && <p className="text-2xl font-bold mb-4">Süre bitti!</p>}
      <motion.button
        onClick={click}
        whileTap={{ scale: 0.9 }}
        disabled={s.phase !== "go"}
        className="w-56 h-56 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-4xl font-black flex items-center justify-center select-none"
      >
        {s.clicks?.[myId] || 0}
      </motion.button>
      <p className="mt-4 text-sm text-white/50">Var gücünle tıkla!</p>
    </div>
  );
}
