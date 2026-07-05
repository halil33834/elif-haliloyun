export type GameType =
  | "ttt"
  | "memory"
  | "rps"
  | "reaction"
  | "hangman"
  | "fastclick"
  | "emoji"
  | "wordduel"
  | "lovequiz"
  | "draw";

export interface PlayerPublic {
  id: string;
  name: string;
  avatar: string;
  ready: boolean;
  connected: boolean;
}

export interface RoomPublic {
  code: string;
  gameType: GameType;
  status: "lobby" | "countdown" | "playing" | "finished";
  players: PlayerPublic[];
  scores: Record<string, number>;
  round: number;
  maxRounds: number;
  state: any;
}

export interface GameMeta {
  type: GameType;
  title: string;
  emoji: string;
  description: string;
  color: string;
}

export const GAME_LIST: GameMeta[] = [
  { type: "ttt", title: "XO (Tic Tac Toe)", emoji: "❌", description: "Klasik XO, sırayla oynanır.", color: "from-purple-500 to-pink-500" },
  { type: "memory", title: "Hafıza Kartları", emoji: "🧠", description: "Eşleri bul, en çok eşleştiren kazanır.", color: "from-blue-500 to-purple-500" },
  { type: "rps", title: "Taş Kağıt Makas", emoji: "✊", description: "3 2 1 sonra aynı anda seç!", color: "from-pink-500 to-rose-500" },
  { type: "reaction", title: "Refleks Testi", emoji: "⚡", description: "Renk değişince ilk basan kazanır.", color: "from-yellow-500 to-orange-500" },
  { type: "hangman", title: "Adam Asmaca VS", emoji: "🪢", description: "Sırayla harf tahmin edin.", color: "from-green-500 to-teal-500" },
  { type: "fastclick", title: "Hızlı Tıklama", emoji: "🖱️", description: "5 saniyede en çok tıklayan kazanır.", color: "from-red-500 to-pink-500" },
  { type: "emoji", title: "Emoji Bil", emoji: "🎭", description: "Emojiyi ilk çözen puan alır.", color: "from-indigo-500 to-purple-500" },
  { type: "wordduel", title: "Kelime Düellosu", emoji: "🔤", description: "Karışık harfleri ilk çözen kazanır.", color: "from-cyan-500 to-blue-500" },
  { type: "lovequiz", title: "Beni Ne Kadar Tanıyorsun?", emoji: "💕", description: "50 sorudan rastgele, birbirinizi tanıyın.", color: "from-pink-500 to-red-500" },
  { type: "draw", title: "Çizim Tahmini", emoji: "🎨", description: "Konu seç, çiz, partnerin puan versin.", color: "from-orange-500 to-yellow-500" }
];
