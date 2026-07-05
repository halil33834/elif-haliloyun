"use client";
import { getSocket } from "@/lib/socket";
import { RoomPublic } from "@/types/game";

const ALPHABET = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ".split("");

export default function Hangman({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  if (!s) return null;
  const isMyTurn = s.turn === myId;
  const opponent = room.players.find((p) => p.id !== myId);

  function guess(letter: string) {
    if (!isMyTurn || s.guessed.includes(letter)) return;
    getSocket().emit("game:action", { type: "GUESS", letter });
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">{isMyTurn ? "Sıra sende, bir harf seç!" : "Rakip tahmin ediyor..."}</p>
      <p className="text-4xl font-black tracking-[0.3em] mb-6">{s.wordDisplay}</p>
      <div className="flex gap-4 mb-6 text-sm">
        <span>Sen yanlış: {s.wrong?.[myId] || 0}/6</span>
        <span>Rakip yanlış: {opponent ? s.wrong?.[opponent.id] || 0 : 0}/6</span>
      </div>
      <div className="grid grid-cols-8 md:grid-cols-10 gap-1 max-w-md">
        {ALPHABET.map((l) => (
          <button
            key={l}
            onClick={() => guess(l)}
            disabled={s.guessed.includes(l) || !isMyTurn}
            className={`w-8 h-8 rounded-lg text-sm font-bold ${
              s.guessed.includes(l) ? "bg-white/10 text-white/30" : "glass hover:bg-purple-600"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
