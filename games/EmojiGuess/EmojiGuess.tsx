"use client";
import { useState } from "react";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import { RoomPublic } from "@/types/game";

export default function EmojiGuess({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  const [value, setValue] = useState("");
  if (!s) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || s.answeredBy) return;
    getSocket().emit("game:action", { type: "ANSWER", value: value.trim() });
    setValue("");
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-white/70">
        Round {s.roundOf}/{room.maxRounds}
      </p>
      <div className="text-6xl mb-6">{s.current?.emoji}</div>
      {s.answeredBy ? (
        <p className="mb-4 font-bold">{s.answeredBy === myId ? "Bildin! 🎉" : "Rakip bildi 😅"} Cevap: {s.current?.answer}</p>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Cevabın..."
            className="bg-white/10 rounded-xl px-4 py-2 outline-none"
          />
          <Button type="submit">Gönder</Button>
        </form>
      )}
    </div>
  );
}
