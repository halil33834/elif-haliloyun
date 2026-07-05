const { nanoid } = require("nanoid");
const engine = require("./gameEngine");

function attachSocketHandlers(io) {
  function broadcastRoom(code) {
    const room = engine.getRoom(code);
    if (!room) return;
    io.to(code).emit("room:update", engine.sanitizeRoom(room));
  }

  function startCountdown(code) {
    const room = engine.getRoom(code);
    if (!room) return;
    room.status = "countdown";
    broadcastRoom(code);
    let n = 3;
    const tick = () => {
      if (!engine.getRoom(code)) return;
      io.to(code).emit("game:countdown", n);
      n -= 1;
      if (n < 0) {
        const r = engine.getRoom(code);
        if (!r) return;
        r.status = "playing";
        r.round = 1;
        r.scores = {};
        r.players.forEach((p) => (r.scores[p.id] = 0));
        r.state = engine.initGameState(r);
        broadcastRoom(code);
        onGameStarted(code);
      } else {
        setTimeout(tick, 800);
      }
    };
    tick();
  }

  function onGameStarted(code) {
    const room = engine.getRoom(code);
    if (!room) return;
    if (room.gameType === "reaction") scheduleReactionRound(code);
    if (room.gameType === "fastclick") scheduleFastClick(code);
  }

  function scheduleReactionRound(code) {
    const room = engine.getRoom(code);
    if (!room) return;
    room.state.phase = "waiting";
    room.state.results = {};
    broadcastRoom(code);
    const delay = 1500 + Math.random() * 2500;
    setTimeout(() => {
      const r = engine.getRoom(code);
      if (!r || r.status !== "playing") return;
      r.state.phase = "go";
      r.state.goAt = Date.now();
      broadcastRoom(code);
    }, delay);
  }

  function scheduleFastClick(code) {
    const room = engine.getRoom(code);
    if (!room) return;
    room.state.phase = "countdown";
    broadcastRoom(code);
    setTimeout(() => {
      const r = engine.getRoom(code);
      if (!r) return;
      r.state.phase = "go";
      r.state.clicks = {};
      r.state.endsAt = Date.now() + 5000;
      broadcastRoom(code);
      setTimeout(() => {
        const r2 = engine.getRoom(code);
        if (!r2) return;
        r2.state.phase = "ended";
        const winnerId = engine.finishFastClick(r2);
        finishGame(code, winnerId);
      }, 5000);
    }, 1200);
  }

  function finishGame(code, winnerId) {
    const room = engine.getRoom(code);
    if (!room) return;
    room.status = "finished";
    io.to(code).emit("game:end", { winnerId, scores: room.scores });
    broadcastRoom(code);
  }

  io.on("connection", (socket) => {
    socket.on("room:create", ({ name, avatar, gameType }, cb) => {
      const player = { id: nanoid(8), socketId: socket.id, name, avatar, ready: false, connected: true };
      const room = engine.createRoom(gameType, player);
      socket.join(room.code);
      socket.data.playerId = player.id;
      socket.data.code = room.code;
      cb && cb({ ok: true, code: room.code, room: engine.sanitizeRoom(room), playerId: player.id });
    });

    socket.on("room:join", ({ code, name, avatar }, cb) => {
      const existingRoom = engine.getRoom(code);
      if (existingRoom) {
        const already = existingRoom.players.find((p) => p.socketId === socket.id);
        if (already) {
          already.connected = true;
          socket.join(code);
          socket.data.playerId = already.id;
          socket.data.code = code;
          cb && cb({ ok: true, room: engine.sanitizeRoom(existingRoom), playerId: already.id });
          broadcastRoom(code);
          return;
        }
      }
      const player = { id: nanoid(8), socketId: socket.id, name, avatar, ready: false, connected: true };
      const result = engine.joinRoom(code, player);
      if (result.error) {
        cb && cb({ ok: false, error: result.error });
        return;
      }
      socket.join(code);
      socket.data.playerId = player.id;
      socket.data.code = code;
      cb && cb({ ok: true, room: engine.sanitizeRoom(result.room), playerId: player.id });
      broadcastRoom(code);
    });

    socket.on("player:ready", () => {
      const code = socket.data.code;
      const room = engine.getRoom(code);
      if (!room) return;
      const p = room.players.find((pp) => pp.id === socket.data.playerId);
      if (p) p.ready = true;
      broadcastRoom(code);
      if (room.players.length === 2 && room.players.every((pp) => pp.ready)) {
        startCountdown(code);
      }
    });

    socket.on("game:action", (action) => {
      const code = socket.data.code;
      const room = engine.getRoom(code);
      if (!room || room.status !== "playing") return;
      const playerId = socket.data.playerId;
      const opponent = room.players.find((p) => p.id !== playerId);

      const result = engine.handleAction(room, playerId, action);
      broadcastRoom(code);

      if (result.finished) {
        finishGame(code, result.winnerId);
        return;
      }

      if (room.gameType === "memory" && room.state.pendingFlipBack) {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r) return;
          engine.resolveMemoryFlipBack(r);
          broadcastRoom(code);
        }, 1000);
      }

      if (room.gameType === "rps" && Object.keys(room.state.choices || {}).length === 0 && room.state.lastRound) {
        setTimeout(() => broadcastRoom(code), 1500);
      }

      if (room.gameType === "reaction" && room.state.phase === "roundEnd") {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r || r.status !== "playing") return;
          r.state.roundOf += 1;
          scheduleReactionRound(code);
        }, 1800);
      }

      if (room.gameType === "emoji" && room.state.answeredBy) {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r || r.status !== "playing") return;
          engine.nextEmojiRound(r);
          broadcastRoom(code);
        }, 1600);
      }

      if (room.gameType === "wordduel" && room.state.answeredBy) {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r || r.status !== "playing") return;
          engine.nextWordDuelRound(r);
          broadcastRoom(code);
        }, 1600);
      }

      if (room.gameType === "lovequiz" && room.state.revealed) {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r || r.status !== "playing") return;
          const done = engine.nextLoveQuizRound(r);
          if (done) {
            const [p1, p2] = r.players;
            const s1 = r.scores[p1.id] || 0;
            const s2 = r.scores[p2.id] || 0;
            finishGame(code, s1 === s2 ? null : s1 > s2 ? p1.id : p2.id);
          } else {
            broadcastRoom(code);
          }
        }, 2600);
      }

      if (room.gameType === "draw" && room.state.rating !== null && room.state.phase !== "choosing") {
        setTimeout(() => {
          const r = engine.getRoom(code);
          if (!r || r.status !== "playing") return;
          const done = engine.nextDrawRound(r);
          if (done) {
            const [p1, p2] = r.players;
            const s1 = r.scores[p1.id] || 0;
            const s2 = r.scores[p2.id] || 0;
            finishGame(code, s1 === s2 ? null : s1 > s2 ? p1.id : p2.id);
          } else {
            broadcastRoom(code);
          }
        }, 2200);
      }
    });

    socket.on("game:drawTimeUp", () => {
      const code = socket.data.code;
      const room = engine.getRoom(code);
      if (!room || room.gameType !== "draw") return;
      room.state.phase = "rating";
      broadcastRoom(code);
    });

    socket.on("chat:message", ({ text }) => {
      const code = socket.data.code;
      const room = engine.getRoom(code);
      if (!room) return;
      const player = room.players.find((p) => p.id === socket.data.playerId);
      io.to(code).emit("chat:message", { from: player ? player.name : "?", text, at: Date.now() });
    });

    socket.on("room:rematch", () => {
      const code = socket.data.code;
      const room = engine.getRoom(code);
      if (!room) return;
      room.players.forEach((p) => (p.ready = false));
      room.status = "lobby";
      room.state = null;
      room.round = 0;
      broadcastRoom(code);
    });

    socket.on("disconnect", () => {
      const room = engine.removePlayer(socket.id);
      if (room) broadcastRoom(room.code);
    });
  });
}

module.exports = { attachSocketHandlers };
