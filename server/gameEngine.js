const { nanoid } = require("nanoid");
const questions = require("./data/questions");
const words = require("./data/words");
const emojiList = require("./data/emojis");

// ---------- ROOM STORE ----------
const rooms = new Map(); // code -> room

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function createRoom(gameType, hostPlayer) {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();
  const room = {
    code,
    gameType,
    status: "lobby", // lobby | countdown | playing | finished
    players: [hostPlayer],
    scores: {},
    round: 0,
    maxRounds: defaultRounds(gameType),
    state: null,
    createdAt: Date.now()
  };
  room.scores[hostPlayer.id] = 0;
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function deleteRoom(code) {
  rooms.delete(code);
}

function defaultRounds(gameType) {
  const map = {
    rps: 5,
    reaction: 5,
    emoji: 8,
    wordduel: 8,
    lovequiz: 10,
    draw: 6
  };
  return map[gameType] || 1;
}

function joinRoom(code, player) {
  const room = getRoom(code);
  if (!room) return { error: "ODA_BULUNAMADI" };
  if (room.players.find((p) => p.id === player.id)) return { room };
  if (room.players.length >= 2) return { error: "ODA_DOLU" };
  room.players.push(player);
  room.scores[player.id] = 0;
  return { room };
}

function removePlayer(socketId) {
  for (const room of rooms.values()) {
    const idx = room.players.findIndex((p) => p.socketId === socketId);
    if (idx !== -1) {
      room.players[idx].connected = false;
      return room;
    }
  }
  return null;
}

function sanitizeRoom(room) {
  return {
    code: room.code,
    gameType: room.gameType,
    status: room.status,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      ready: !!p.ready,
      connected: p.connected !== false
    })),
    scores: room.scores,
    round: room.round,
    maxRounds: room.maxRounds,
    state: publicState(room)
  };
}

// Hides private data (e.g. drawer-only word, memory face-down cards) per-player if needed.
// For simplicity we send the same state to both, but hide secret fields via null-masking.
function publicState(room) {
  if (!room.state) return null;
  const s = { ...room.state };
  if (room.gameType === "hangman" && s.word) {
    s.wordDisplay = s.word
      .split("")
      .map((ch) => (s.guessed.includes(ch) ? ch : "_"))
      .join(" ");
    delete s.word; // hide real word until finished
  }
  return s;
}

// ---------- GAME INITIALIZERS ----------
function initGameState(room) {
  const [p1, p2] = room.players;
  switch (room.gameType) {
    case "ttt":
      return { board: Array(9).fill(null), turn: p1.id, symbols: { [p1.id]: "X", [p2.id]: "O" } };
    case "memory": {
      const emojisPool = ["🍎","🍌","🍇","🍒","🍉","🥝","🍓","🍍"];
      let cards = [...emojisPool, ...emojisPool]
        .map((v, i) => ({ id: i, value: v, flipped: false, matched: false }))
        .sort(() => Math.random() - 0.5);
      return { cards, flippedIds: [], turn: p1.id };
    }
    case "rps":
      return { choices: {}, roundWins: {}, roundOf: 1 };
    case "reaction":
      return { phase: "waiting", goAt: null, results: {}, roundOf: 1, timerHandle: null };
    case "hangman": {
      const word = words[Math.floor(Math.random() * words.length)];
      return { word, guessed: [], wrong: {}, maxWrong: 6, turn: p1.id, finished: false };
    }
    case "fastclick":
      return { phase: "waiting", clicks: {}, endsAt: null };
    case "emoji": {
      const item = pickRandomUnused(room, emojiList);
      return { current: item, answeredBy: null, roundOf: 1, used: [item] };
    }
    case "wordduel": {
      const w = words[Math.floor(Math.random() * words.length)];
      return { word: w, scrambled: scramble(w), answeredBy: null, roundOf: 1, used: [w] };
    }
    case "lovequiz": {
      const pool = shuffle([...Array(questions.length).keys()]).slice(0, room.maxRounds);
      return {
        pool,
        idx: 0,
        question: questions[pool[0]],
        answererId: p1.id,
        secretAnswer: null,
        guess: null,
        revealed: false
      };
    }
    case "draw": {
      return {
        drawerId: p1.id,
        topics: pickTopics(),
        chosenTopic: null,
        strokes: [],
        rating: null,
        phase: "choosing"
      };
    }
    default:
      return {};
  }
}

function pickTopics() {
  const all = ["Ev", "Kalp", "Güneş", "Kedi", "Deniz", "Ağaç", "Araba", "Çiçek", "Yıldız", "Balık", "Şemsiye", "Dağ"];
  return shuffle(all).slice(0, 3);
}

function pickRandomUnused(room, list) {
  const used = (room.state && room.state.used) || [];
  const available = list.filter((it) => !used.includes(it));
  const pool = available.length ? available : list;
  return pool[Math.floor(Math.random() * pool.length)];
}

function scramble(word) {
  const arr = word.split("");
  do {
    arr.sort(() => Math.random() - 0.5);
  } while (arr.join("") === word && word.length > 1);
  return arr.join("");
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function similar(a, b) {
  if (!a || !b) return false;
  const norm = (s) =>
    s
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  return norm(a) === norm(b);
}

// ---------- ACTION HANDLER ----------
// Returns { finished: boolean, winnerId?: string|null }
function handleAction(room, playerId, action) {
  const opponent = room.players.find((p) => p.id !== playerId);
  const opponentId = opponent ? opponent.id : null;

  switch (room.gameType) {
    case "ttt":
      return handleTTT(room, playerId, action);
    case "memory":
      return handleMemory(room, playerId, action);
    case "rps":
      return handleRPS(room, playerId, action, opponentId);
    case "reaction":
      return handleReaction(room, playerId, action);
    case "hangman":
      return handleHangman(room, playerId, action, opponentId);
    case "fastclick":
      return handleFastClick(room, playerId, action);
    case "emoji":
      return handleEmoji(room, playerId, action, opponentId);
    case "wordduel":
      return handleWordDuel(room, playerId, action, opponentId);
    case "lovequiz":
      return handleLoveQuiz(room, playerId, action, opponentId);
    case "draw":
      return handleDraw(room, playerId, action, opponentId);
    default:
      return { finished: false };
  }
}

function handleTTT(room, playerId, action) {
  const s = room.state;
  if (action.type !== "MOVE" || s.turn !== playerId) return { finished: false };
  const i = action.index;
  if (s.board[i] !== null) return { finished: false };
  s.board[i] = s.symbols[playerId];
  const winLines = [
    [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
  ];
  const mySymbol = s.symbols[playerId];
  const won = winLines.some((line) => line.every((idx) => s.board[idx] === mySymbol));
  if (won) return { finished: true, winnerId: playerId };
  if (s.board.every((c) => c !== null)) return { finished: true, winnerId: null };
  const other = room.players.find((p) => p.id !== playerId);
  s.turn = other.id;
  return { finished: false };
}

function handleMemory(room, playerId, action) {
  const s = room.state;
  if (action.type !== "FLIP" || s.turn !== playerId) return { finished: false };
  const card = s.cards.find((c) => c.id === action.id);
  if (!card || card.flipped || card.matched) return { finished: false };
  if (s.flippedIds.length >= 2) return { finished: false };
  card.flipped = true;
  s.flippedIds.push(card.id);

  if (s.flippedIds.length === 2) {
    const [a, b] = s.flippedIds.map((id) => s.cards.find((c) => c.id === id));
    if (a.value === b.value) {
      a.matched = true;
      b.matched = true;
      room.scores[playerId] = (room.scores[playerId] || 0) + 1;
      s.flippedIds = [];
      if (s.cards.every((c) => c.matched)) {
        const other = room.players.find((p) => p.id !== playerId);
        const myScore = room.scores[playerId] || 0;
        const otherScore = room.scores[other.id] || 0;
        return { finished: true, winnerId: myScore === otherScore ? null : myScore > otherScore ? playerId : other.id };
      }
      return { finished: false }; // stays same player's turn (matched -> play again)
    } else {
      // schedule flip back handled by caller with timeout via returned flag
      s.pendingFlipBack = true;
    }
  }
  return { finished: false };
}

function resolveMemoryFlipBack(room) {
  const s = room.state;
  if (!s.pendingFlipBack) return;
  s.flippedIds.forEach((id) => {
    const c = s.cards.find((cc) => cc.id === id);
    if (c && !c.matched) c.flipped = false;
  });
  s.flippedIds = [];
  s.pendingFlipBack = false;
  const other = room.players.find((p) => p.id !== s.turn);
  s.turn = other.id;
}

function handleRPS(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type !== "CHOOSE") return { finished: false };
  s.choices[playerId] = action.value;
  if (!s.choices[opponentId]) return { finished: false, waiting: true };

  const a = s.choices[playerId];
  const b = s.choices[opponentId];
  let roundWinner = null;
  if (a !== b) {
    const beats = { rock: "scissors", scissors: "paper", paper: "rock" };
    roundWinner = beats[a] === b ? playerId : opponentId;
    s.roundWins[roundWinner] = (s.roundWins[roundWinner] || 0) + 1;
    room.scores[roundWinner] = (room.scores[roundWinner] || 0) + 1;
  }
  const need = Math.ceil(room.maxRounds / 2);
  const finished = Object.values(s.roundWins).some((w) => w >= need) || s.roundOf >= room.maxRounds;
  s.lastRound = { a, b, winnerId: roundWinner, choices: { ...s.choices } };
  s.choices = {};
  s.roundOf += 1;

  if (finished) {
    const winnerId =
      (s.roundWins[playerId] || 0) === (s.roundWins[opponentId] || 0)
        ? null
        : (s.roundWins[playerId] || 0) > (s.roundWins[opponentId] || 0)
        ? playerId
        : opponentId;
    return { finished: true, winnerId };
  }
  return { finished: false };
}

function handleReaction(room, playerId, action) {
  const s = room.state;
  if (action.type === "CLICK") {
    if (s.phase !== "go") return { finished: false };
    if (s.results[playerId]) return { finished: false };
    s.results[playerId] = Date.now() - s.goAt;
    const opponent = room.players.find((p) => p.id !== playerId);
    if (s.results[opponent.id]) {
      const winnerId = s.results[playerId] < s.results[opponent.id] ? playerId : opponent.id;
      room.scores[winnerId] = (room.scores[winnerId] || 0) + 1;
      const finished = s.roundOf >= room.maxRounds;
      if (finished) {
        const myScore = room.scores[playerId] || 0;
        const otherScore = room.scores[opponent.id] || 0;
        return { finished: true, winnerId: myScore === otherScore ? null : myScore > otherScore ? playerId : opponent.id };
      }
      s.phase = "roundEnd";
    }
  }
  return { finished: false };
}

function handleHangman(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type !== "GUESS" || s.turn !== playerId || s.finished) return { finished: false };
  const letter = action.letter.toUpperCase();
  if (s.guessed.includes(letter)) return { finished: false };
  s.guessed.push(letter);
  if (!s.word.includes(letter)) {
    s.wrong[playerId] = (s.wrong[playerId] || 0) + 1;
    if (s.wrong[playerId] >= s.maxWrong) {
      s.finished = true;
      return { finished: true, winnerId: opponentId };
    }
  } else {
    const complete = s.word.split("").every((ch) => s.guessed.includes(ch));
    if (complete) {
      s.finished = true;
      room.scores[playerId] = (room.scores[playerId] || 0) + 1;
      return { finished: true, winnerId: playerId };
    }
  }
  s.turn = opponentId;
  return { finished: false };
}

function handleFastClick(room, playerId, action) {
  const s = room.state;
  if (action.type !== "CLICK" || s.phase !== "go") return { finished: false };
  s.clicks[playerId] = (s.clicks[playerId] || 0) + 1;
  return { finished: false };
}

function finishFastClick(room) {
  const s = room.state;
  const [p1, p2] = room.players;
  const c1 = s.clicks[p1.id] || 0;
  const c2 = s.clicks[p2.id] || 0;
  room.scores[p1.id] = c1;
  room.scores[p2.id] = c2;
  return c1 === c2 ? null : c1 > c2 ? p1.id : p2.id;
}

function handleEmoji(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type !== "ANSWER" || s.answeredBy) return { finished: false };
  if (similar(action.value, s.current.answer)) {
    s.answeredBy = playerId;
    room.scores[playerId] = (room.scores[playerId] || 0) + 1;
    const finished = s.roundOf >= room.maxRounds;
    if (finished) {
      const myScore = room.scores[playerId] || 0;
      const otherScore = room.scores[opponentId] || 0;
      return { finished: true, winnerId: myScore === otherScore ? null : myScore > otherScore ? playerId : opponentId };
    }
  }
  return { finished: false };
}

function nextEmojiRound(room) {
  const s = room.state;
  s.roundOf += 1;
  const item = pickRandomUnused(room, emojiList);
  s.used.push(item);
  s.current = item;
  s.answeredBy = null;
}

function handleWordDuel(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type !== "ANSWER" || s.answeredBy) return { finished: false };
  if (similar(action.value, s.word)) {
    s.answeredBy = playerId;
    room.scores[playerId] = (room.scores[playerId] || 0) + 1;
    const finished = s.roundOf >= room.maxRounds;
    if (finished) {
      const myScore = room.scores[playerId] || 0;
      const otherScore = room.scores[opponentId] || 0;
      return { finished: true, winnerId: myScore === otherScore ? null : myScore > otherScore ? playerId : opponentId };
    }
  }
  return { finished: false };
}

function nextWordDuelRound(room) {
  const s = room.state;
  s.roundOf += 1;
  let w = words[Math.floor(Math.random() * words.length)];
  let tries = 0;
  while (s.used.includes(w) && tries < 20) {
    w = words[Math.floor(Math.random() * words.length)];
    tries++;
  }
  s.used.push(w);
  s.word = w;
  s.scrambled = scramble(w);
  s.answeredBy = null;
}

function handleLoveQuiz(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type === "SECRET_ANSWER" && playerId === s.answererId && !s.secretAnswer) {
    s.secretAnswer = action.value;
  } else if (action.type === "GUESS" && playerId !== s.answererId && s.secretAnswer && !s.guess) {
    s.guess = action.value;
    s.revealed = true;
    const match = similar(s.guess, s.secretAnswer);
    if (match) room.scores[playerId] = (room.scores[playerId] || 0) + 1;
    s.lastMatch = match;
  }
  return { finished: false };
}

function nextLoveQuizRound(room) {
  const s = room.state;
  s.idx += 1;
  if (s.idx >= s.pool.length) return true; // signal finished
  s.question = questions[s.pool[s.idx]];
  const other = room.players.find((p) => p.id !== s.answererId);
  s.answererId = other.id;
  s.secretAnswer = null;
  s.guess = null;
  s.revealed = false;
  s.lastMatch = null;
  return false;
}

function handleDraw(room, playerId, action, opponentId) {
  const s = room.state;
  if (action.type === "CHOOSE_TOPIC" && playerId === s.drawerId && s.phase === "choosing") {
    s.chosenTopic = action.topic;
    s.phase = "drawing";
  } else if (action.type === "STROKE" && playerId === s.drawerId && s.phase === "drawing") {
    s.strokes.push(action.stroke);
  } else if (action.type === "CLEAR" && playerId === s.drawerId) {
    s.strokes = [];
  } else if (action.type === "RATE" && playerId !== s.drawerId && s.phase === "rating") {
    s.rating = action.value;
    room.scores[s.drawerId] = (room.scores[s.drawerId] || 0) + Number(action.value);
  }
  return { finished: false };
}

function nextDrawRound(room) {
  const s = room.state;
  const other = room.players.find((p) => p.id !== s.drawerId);
  room.round += 1;
  if (room.round >= room.maxRounds) return true;
  s.drawerId = other.id;
  s.topics = pickTopics();
  s.chosenTopic = null;
  s.strokes = [];
  s.rating = null;
  s.phase = "choosing";
  return false;
}

module.exports = {
  rooms,
  createRoom,
  getRoom,
  deleteRoom,
  joinRoom,
  removePlayer,
  sanitizeRoom,
  initGameState,
  handleAction,
  resolveMemoryFlipBack,
  finishFastClick,
  nextEmojiRound,
  nextWordDuelRound,
  nextLoveQuizRound,
  nextDrawRound
};
