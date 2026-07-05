import { create } from "zustand";

interface UserState {
  name: string;
  avatar: string;
  setUser: (name: string, avatar: string) => void;
}

const AVATARS = ["🦊", "🐱", "🐶", "🐼", "🐨", "🦁", "🐸", "🐵", "🦄", "🐰"];

export const useUserStore = create<UserState>((set) => ({
  name: "",
  avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
  setUser: (name, avatar) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ehl_name", name);
      window.localStorage.setItem("ehl_avatar", avatar);
    }
    set({ name, avatar });
  }
}));

export function loadStoredUser() {
  if (typeof window === "undefined") return null;
  const name = window.localStorage.getItem("ehl_name");
  const avatar = window.localStorage.getItem("ehl_avatar");
  if (name) return { name, avatar: avatar || "🦊" };
  return null;
}

export { AVATARS };
