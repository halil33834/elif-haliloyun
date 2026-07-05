"use client";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

export default function Memory({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  if (!s) return null;
  const isMyTurn = s.turn === myId;

  function flip(id: number) {
    if (!isMyTurn) return;
    const card = s.cards.find((c: any) => c.id === id);
    if (card.flipped || card.matched) return;
    getSocket().emit("game:action", { type: "FLIP", id });
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">{isMyTurn ? "Sıra sende, iki kart aç!" : "Rakip oynuyor..."}</p>
      <div className="grid grid-cols-4 gap-2">
        {s.cards.map((card: any) => (
          <motion.button
            key={card.id}
            onClick={() => flip(card.id)}
            whileHover={{ scale: card.matched ? 1 : 1.05 }}
            className={`w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center text-2xl md:text-3xl ${
              card.matched ? "bg-green-500/30" : "glass"
            }`}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span key="front" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}>
                  {card.value}
                </motion.span>
              ) : (
                <motion.span key="back" initial={{ rotateY: 90 }} animate={{ rotateY: 0 }}>
                  ❔
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
