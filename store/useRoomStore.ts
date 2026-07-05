import { create } from "zustand";
import { RoomPublic } from "@/types/game";

interface RoomState {
  room: RoomPublic | null;
  myId: string;
  countdown: number | null;
  winnerId: string | null | undefined;
  chat: { from: string; text: string; at: number }[];
  setRoom: (room: RoomPublic) => void;
  setMyId: (id: string) => void;
  setCountdown: (n: number | null) => void;
  setWinner: (id: string | null | undefined) => void;
  addChat: (msg: { from: string; text: string; at: number }) => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  room: null,
  myId: "",
  countdown: null,
  winnerId: undefined,
  chat: [],
  setRoom: (room) => set({ room }),
  setMyId: (id) => set({ myId: id }),
  setCountdown: (n) => set({ countdown: n }),
  setWinner: (id) => set({ winnerId: id }),
  addChat: (msg) => set((s) => ({ chat: [...s.chat, msg] })),
  reset: () => set({ room: null, countdown: null, winnerId: undefined, chat: [] })
}));
