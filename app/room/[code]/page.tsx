"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { useUserStore, loadStoredUser } from "@/store/useUserStore";
import { useRoomStore } from "@/store/useRoomStore";
import GameShell from "@/components/GameShell";
import Countdown from "@/components/Countdown";
import Chat from "@/components/Chat";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

import TicTacToe from "@/games/TicTacToe/TicTacToe";
import Memory from "@/games/Memory/Memory";
import RockPaperScissors from "@/games/RockPaperScissors/RPS";
import ReactionTest from "@/games/ReactionTest/ReactionTest";
import Hangman from "@/games/Hangman/Hangman";
import FastClick from "@/games/FastClick/FastClick";
import EmojiGuess from "@/games/EmojiGuess/EmojiGuess";
import WordDuel from "@/games/WordDuel/WordDuel";
import LoveQuiz from "@/games/LoveQuiz/LoveQuiz";
import DrawGuess from "@/games/DrawGuess/DrawGuess";

const GAME_COMPONENTS: Record<string, any> = {
  ttt: TicTacToe,
  memory: Memory,
  rps: RockPaperScissors,
  reaction: ReactionTest,
  hangman: Hangman,
  fastclick: FastClick,
  emoji: EmojiGuess,
  wordduel: WordDuel,
  lovequiz: LoveQuiz,
  draw: DrawGuess
};

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { name, avatar, setUser } = useUserStore();
  const [inputName, setInputName] = useState("");
  const [joinError, setJoinError] = useState("");
  const { room, myId, countdown, winnerId, chat, setRoom, setMyId, setCountdown, setWinner, addChat, reset } =
    useRoomStore();

  useEffect(() => {
    const stored = loadStoredUser();
    if (stored && !name) setUser(stored.name, stored.avatar);
  }, []);

  useEffect(() => {
    if (!name) return;
    const socket = getSocket();

    socket.emit("room:join", { code, name, avatar }, (res: any) => {
      if (res?.ok) {
        setRoom(res.room);
        setMyId(res.playerId);
      } else {
        setJoinError(res?.error === "ODA_DOLU" ? "Oda dolu 😔" : "Oda bulunamadı 😕");
      }
    });

    function onRoomUpdate(r: any) {
      setRoom(r);
    }
    function onCountdown(n: number) {
      setCountdown(n === 0 ? 0 : n);
      if (n === 0) setTimeout(() => setCountdown(null), 700);
    }
    function onGameEnd({ winnerId }: any) {
      setWinner(winnerId);
    }
    function onChat(msg: any) {
      addChat(msg);
    }

    socket.on("room:update", onRoomUpdate);
    socket.on("game:countdown", onCountdown);
    socket.on("game:end", onGameEnd);
    socket.on("chat:message", onChat);

    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("game:countdown", onCountdown);
      socket.off("game:end", onGameEnd);
      socket.off("chat:message", onChat);
    };
  }, [name]);

  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Odaya katılmak için isim gir</h1>
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            placeholder="Kullanıcı Adın"
            className="w-full bg-white/10 rounded-xl px-4 py-3 mb-4 outline-none text-center"
          />
          <Button className="w-full" onClick={() => inputName.trim() && setUser(inputName.trim(), "🦊")}>
            Katıl
          </Button>
        </Card>
      </div>
    );
  }

  if (joinError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="text-center">
          <p className="mb-4">{joinError}</p>
          <Button onClick={() => router.push("/")}>Ana Menü</Button>
        </Card>
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-screen flex items-center justify-center text-white/60">Bağlanılıyor...</div>;
  }

  const GameComponent = GAME_COMPONENTS[room.gameType];

  function handleReady() {
    getSocket().emit("player:ready");
  }
  function handleRematch() {
    setWinner(undefined);
    getSocket().emit("room:rematch");
  }
  function handleMenu() {
    reset();
    router.push("/");
  }
  function sendChat(text: string) {
    getSocket().emit("chat:message", { text });
  }

  return (
    <div>
      <Countdown value={countdown} />
      <GameShell room={room} myId={myId} winnerId={winnerId} onReady={handleReady} onRematch={handleRematch} onMenu={handleMenu}>
        {GameComponent && <GameComponent room={room} myId={myId} />}
      </GameShell>
      <div className="max-w-3xl mx-auto px-4">
        <Chat messages={chat} onSend={sendChat} />
      </div>
    </div>
  );
}
