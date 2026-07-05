"use client";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

export default function TicTacToe({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  if (!s) return null;
  const mySymbol = s.symbols[myId];
  const isMyTurn = s.turn === myId;

  function play(i: number) {
    if (!isMyTurn || s.board[i]) return;
    getSocket().emit("game:action", { type: "MOVE", index: i });
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">
        {isMyTurn ? "Sıra sende! " : "Rakip oynuyor... "} Sen: <b>{mySymbol}</b>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {s.board.map((cell: string | null, i: number) => (
          <motion.button
            key={i}
            whileHover={{ scale: cell ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => play(i)}
            className="w-20 h-20 md:w-24 md:h-24 glass rounded-2xl flex items-center justify-center text-4xl font-black"
          >
            {cell === "X" && <span className="text-pink-400">X</span>}
            {cell === "O" && <span className="text-purple-400">O</span>}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
