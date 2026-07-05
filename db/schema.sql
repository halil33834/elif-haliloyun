-- ELIF & HALIL OYUN - VERITABANI TABLOLARI (PostgreSQL)
-- Bu dosya Prisma migration'larıyla aynı yapıyı elle SQL olarak da görebilmen için verilmiştir.

CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  username    TEXT UNIQUE NOT NULL,
  email       TEXT UNIQUE,
  password    TEXT,
  avatar      TEXT NOT NULL DEFAULT '🦊',
  is_guest    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE rooms (
  id          TEXT PRIMARY KEY,
  code        TEXT UNIQUE NOT NULL,
  game_type   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'lobby',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at   TIMESTAMP
);

CREATE TABLE matches (
  id          TEXT PRIMARY KEY,
  room_id     TEXT NOT NULL REFERENCES rooms(id),
  game_type   TEXT NOT NULL,
  player1_id  TEXT NOT NULL REFERENCES users(id),
  player2_id  TEXT NOT NULL REFERENCES users(id),
  winner_id   TEXT REFERENCES users(id),
  score1      INTEGER NOT NULL DEFAULT 0,
  score2      INTEGER NOT NULL DEFAULT 0,
  started_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at    TIMESTAMP
);

CREATE TABLE game_results (
  id          TEXT PRIMARY KEY,
  match_id    TEXT NOT NULL REFERENCES matches(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  result      TEXT NOT NULL, -- 'win' | 'lose' | 'draw'
  score       INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE friends (
  id          TEXT PRIMARY KEY,
  user_a_id   TEXT NOT NULL REFERENCES users(id),
  user_b_id   TEXT NOT NULL REFERENCES users(id),
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | blocked
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_a_id, user_b_id)
);

CREATE TABLE online_players (
  id          TEXT PRIMARY KEY,
  user_id     TEXT UNIQUE NOT NULL REFERENCES users(id),
  socket_id   TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'online', -- online | in_game | away
  last_seen   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
  id          TEXT PRIMARY KEY,
  room_id     TEXT NOT NULL REFERENCES rooms(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
  id          TEXT PRIMARY KEY,
  key         TEXT UNIQUE NOT NULL,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT '🏆'
);

CREATE TABLE user_achievements (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL REFERENCES users(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE leaderboard (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id),
  period      TEXT NOT NULL, -- weekly | monthly | alltime
  wins        INTEGER NOT NULL DEFAULT 0,
  losses      INTEGER NOT NULL DEFAULT 0,
  points      INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, period)
);
