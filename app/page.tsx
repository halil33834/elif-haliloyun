"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useUserStore, loadStoredUser, AVATARS } from "@/store/useUserStore";
import { getSocket } from "@/lib/socket";
import { GAME_LIST, GameType } from "@/types/game";

export default function HomePage() {
  const router = useRouter();
  const { name, avatar, setUser } = useUserStore();
  const [inputName, setInputName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored) {
      setUser(stored.name, stored.avatar);
      setInputName(stored.name);
      setSelectedAvatar(stored.avatar);
    }
  }, []);

  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-1">💜 Elif & Halil Oyun</h1>
          <p className="text-white/60 mb-6">Devam etmeden önce kullanıcı adını seç</p>
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Kullanıcı Adın"
            maxLength={16}
            className="w-full bg-white/10 rounded-xl px-4 py-3 mb-4 outline-none text-center"
          />
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAvatar(a)}
                className={`text-2xl w-11 h-11 rounded-xl ${
                  selectedAvatar === a ? "bg-purple-600" : "bg-white/10"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => inputName.trim() && setUser(inputName.trim(), selectedAvatar)}
          >
            Devam Et (Guest)
          </Button>
        </Card>
      </div>
    );
  }

  function createRoom(gameType: GameType) {
    const socket = getSocket();
    socket.emit("room:create", { name, avatar, gameType }, (res: any) => {
      if (res?.ok) router.push(`/room/${res.code}`);
    });
  }

  function joinRoom() {
    if (!joinCode.trim()) return;
    const socket = getSocket();
    socket.emit("room:join", { code: joinCode.trim().toUpperCase(), name, avatar }, (res: any) => {
      if (res?.ok) router.push(`/room/${joinCode.trim().toUpperCase()}`);
      else setError(res?.error === "ODA_DOLU" ? "Oda dolu 😔" : "Oda bulunamadı 😕");
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{avatar}</span>
          <div>
            <p className="font-bold">{name}</p>
            <p className="text-xs text-green-400">● Çevrimiçi</p>
          </div>
        </div>
        <h1 className="text-lg md:text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          💜 Elif & Halil Oyun
        </h1>
      </div>

      <Card className="mb-8 flex flex-col md:flex-row items-center gap-3 justify-between">
        <p className="font-semibold">Bir oda kodun var mı?</p>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="ör: ABC123"
            className="flex-1 bg-white/10 rounded-xl px-4 py-2 outline-none uppercase"
          />
          <Button onClick={joinRoom}>Katıl</Button>
        </div>
      </Card>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <h2 className="text-lg font-bold mb-4">Bir oyun seç, oda kur:</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {GAME_LIST.map((g, i) => (
          <motion.div key={g.type} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card onClick={() => createRoom(g.type)} className={`bg-gradient-to-br ${g.color} bg-opacity-10`}>
              <div className="text-3xl mb-2">{g.emoji}</div>
              <p className="font-bold">{g.title}</p>
              <p className="text-xs text-white/70 mt-1">{g.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
