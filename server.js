// Local geliştirme için: Next.js + Socket.IO TEK process'te birlikte çalışır (npm run dev).
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { attachSocketHandlers } = require("./server/socketHandlers");

const dev = process.env.NODE_ENV !== "production";
const port = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  attachSocketHandlers(io);

  httpServer.listen(port, () => {
    console.log(`> elif-haliloyun (Next + Socket.IO birlikte) http://localhost:${port}`);
  });
});
