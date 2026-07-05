"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import Button from "@/components/ui/Button";
import { RoomPublic } from "@/types/game";

const DRAW_SECONDS = 40;

export default function DrawGuess({ room, myId }: { room: RoomPublic; myId: string }) {
  const s = room.state;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentPoints = useRef<[number, number][]>([]);
  const [secondsLeft, setSecondsLeft] = useState(DRAW_SECONDS);
  const isDrawer = s?.drawerId === myId;

  // redraw canvas whenever strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !s) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#f5f3ff";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    (s.strokes || []).forEach((stroke: any) => {
      ctx.beginPath();
      stroke.points.forEach(([x, y]: [number, number], idx: number) => {
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [s?.strokes]);

  useEffect(() => {
    if (s?.phase !== "drawing") return;
    setSecondsLeft(DRAW_SECONDS);
    const iv = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(iv);
          if (isDrawer) getSocket().emit("game:drawTimeUp");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [s?.phase]);

  if (!s) return null;

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as [number, number];
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawer || s.phase !== "drawing") return;
    drawing.current = true;
    currentPoints.current = [getPos(e)];
  }
  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    currentPoints.current.push(getPos(e));
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx && currentPoints.current.length > 1) {
        const [x1, y1] = currentPoints.current[currentPoints.current.length - 2];
        const [x2, y2] = currentPoints.current[currentPoints.current.length - 1];
        ctx.strokeStyle = "#f5f3ff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
  }
  function onUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentPoints.current.length > 1) {
      getSocket().emit("game:action", { type: "STROKE", stroke: { points: currentPoints.current } });
    }
    currentPoints.current = [];
  }

  function chooseTopic(topic: string) {
    getSocket().emit("game:action", { type: "CHOOSE_TOPIC", topic });
  }
  function clearCanvas() {
    getSocket().emit("game:action", { type: "CLEAR" });
  }
  function rate(value: number) {
    getSocket().emit("game:action", { type: "RATE", value });
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-4 text-white/70">Round {room.round}/{room.maxRounds}</p>

      {s.phase === "choosing" &&
        (isDrawer ? (
          <div className="text-center">
            <p className="mb-3">Bir konu seç, çizeceksin:</p>
            <div className="flex gap-3">
              {s.topics.map((t: string) => (
                <Button key={t} onClick={() => chooseTopic(t)}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <p>Rakip konu seçiyor...</p>
        ))}

      {(s.phase === "drawing" || s.phase === "rating") && (
        <>
          {isDrawer && s.phase === "drawing" && (
            <p className="mb-2 text-sm text-white/70">
              Konu: <b>{s.chosenTopic}</b> — süre: {secondsLeft}s
            </p>
          )}
          {!isDrawer && <p className="mb-2 text-sm text-white/70">Rakip çiziyor, ne olduğunu tahmin et!</p>}
          <canvas
            ref={canvasRef}
            width={480}
            height={320}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
            className="glass rounded-2xl touch-none bg-black/20 w-full max-w-[480px]"
          />
          {isDrawer && s.phase === "drawing" && (
            <Button variant="ghost" className="mt-3 text-sm" onClick={clearCanvas}>
              Temizle
            </Button>
          )}
          {s.phase === "rating" && !isDrawer && s.rating === null && (
            <div className="mt-4 text-center">
              <p className="mb-2">Konuya ne kadar benziyordu? Puan ver:</p>
              <div className="flex gap-1 flex-wrap justify-center">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => rate(n)} className="w-9 h-9 rounded-lg glass hover:bg-purple-600">
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
          {s.phase === "rating" && s.rating !== null && (
            <p className="mt-4 font-bold">Puan: {s.rating}/10 — konu: {s.chosenTopic}</p>
          )}
          {s.phase === "rating" && isDrawer && s.rating === null && (
            <p className="mt-4 text-white/60">Rakip puan veriyor...</p>
          )}
        </>
      )}
    </div>
  );
}
