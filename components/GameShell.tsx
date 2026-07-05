"use client";
import { motion } from "framer-motion";
import Button from "./ui/Button";
import Card from "./ui/Card";
import { RoomPublic } from "@/types/game";
import { GAME_LIST } from "@/types/game";

export default function GameShell({
  room,
  myId,
  winnerId,
  onReady,
  onRematch,
  onMenu,
  children
}: {
  room: RoomPublic;
  myId: string;
  winnerId: string | null | undefined;
  onReady: () => void;
  onRematch: () => void;
  onMenu: () => void;
  children: React.ReactNode;
}) {
  const meta = GAME_LIST.find((g) => g.type === room.gameType);
  const me = room.players.find((p) => p.id === myId);
  const opponent = room.players.find((p) => p.id !== myId);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <span>{meta?.emoji}</span> {meta?.title}
        </h1>
        <span className="text-sm text-white/60">Oda: {room.code}</span>
      </div>

      {/* Score bar */}
      <div className="flex items-center justify-between glass rounded-2xl px-4 py-3 mb-6">
        <PlayerBadge name={me?.name} avatar={me?.avatar} score={room.scores[myId] || 0} you />
        <span className="text-white/40 font-bold">VS</span>
        <PlayerBadge
          name={opponent?.name}
          avatar={opponent?.avatar}
          score={opponent ? room.scores[opponent.id] || 0 : 0}
          connected={opponent?.connected}
        />
      </div>

      {room.status === "lobby" && (
        <Card className="text-center py-10">
          <p className="mb-4 text-white/70">
            {opponent ? "Rakibin katıldı! Hazır olduğunda başlat." : "Rakibin bekleniyor... Oda kodunu paylaş:"}
          </p>
          <p className="text-3xl font-black tracking-widest mb-6">{room.code}</p>
          <Button onClick={onReady} disabled={me?.ready}>
            {me?.ready ? "Hazır ✓ (rakip bekleniyor)" : "Hazırım!"}
          </Button>
        </Card>
      )}

      {(room.status === "countdown" || room.status === "playing") && <div>{children}</div>}

      {room.status === "finished" && (
        <Card className="text-center py-10">
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-black mb-2"
          >
            {winnerId === null ? "🤝 Berabere!" : winnerId === myId ? "🎉 Kazandın!" : "😢 Kaybettin!"}
          </motion.p>
          <p className="text-white/60 mb-6">
            {room.scores[myId] || 0} - {opponent ? room.scores[opponent.id] || 0 : 0}
          </p>
          <div className="flex gap-3 justify-center">
            <Button onClick={onRematch}>Tekrar Oyna</Button>
            <Button variant="ghost" onClick={onMenu}>
              Ana Menü
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function PlayerBadge({
  name,
  avatar,
  score,
  you,
  connected = true
}: {
  name?: string;
  avatar?: string;
  score: number;
  you?: boolean;
  connected?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">{avatar || "❓"}</span>
      <div>
        <p className="text-sm font-semibold">
          {name || "Bekleniyor..."} {you && "(Sen)"}
        </p>
        <p className="text-xs text-white/50">{connected ? `Skor: ${score}` : "Bağlantı koptu"}</p>
      </div>
    </div>
  );
}
