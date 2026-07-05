"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import { RoomPublic } from "@/types/game";

export default function LoveQuiz({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue("");
  }, [s?.idx]);

  if (!s) return null;
  const isAnswerer = s.answererId === myId;

  function submitSecret(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    getSocket().emit("game:action", { type: "SECRET_ANSWER", value: value.trim() });
    setValue("");
  }
  function submitGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    getSocket().emit("game:action", { type: "GUESS", value: value.trim() });
    setValue("");
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-2 text-white/70">
        Soru {s.idx + 1}/{s.pool.length}
      </p>
      <p className="text-xl font-bold mb-6">{s.question}</p>

      {isAnswerer ? (
        !s.secretAnswer ? (
          <>
            <p className="text-sm text-white/60 mb-2">Bu soru senin hakkında! Doğru cevabı yaz (rakip görmeyecek):</p>
            <form onSubmit={submitSecret} className="flex gap-2">
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-white/10 rounded-xl px-4 py-2 outline-none"
                placeholder="Cevabın..."
              />
              <Button type="submit">Kaydet</Button>
            </form>
          </>
        ) : (
          <p className="text-white/60">Rakip tahmin ediyor...</p>
        )
      ) : !s.secretAnswer ? (
        <p className="text-white/60">Rakip cevabını yazıyor...</p>
      ) : !s.guess ? (
        <>
          <p className="text-sm text-white/60 mb-2">Rakibin cevabını tahmin et:</p>
          <form onSubmit={submitGuess} className="flex gap-2">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="bg-white/10 rounded-xl px-4 py-2 outline-none"
              placeholder="Tahminin..."
            />
            <Button type="submit">Gönder</Button>
          </form>
        </>
      ) : null}

      {s.revealed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 glass rounded-2xl p-4">
          <p>Gerçek cevap: <b>{s.secretAnswer}</b></p>
          <p>Tahmin: <b>{s.guess}</b></p>
          <p className="mt-2 font-bold">{s.lastMatch ? "Tuttu! 🎯 +1 puan" : "Tutmadı 😅"}</p>
        </motion.div>
      )}
    </div>
  );
}
