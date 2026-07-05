// Bu dosya Netlify + Render senaryosu için: SADECE Socket.IO sunucusu, Next.js içermez.
// Render'da başlatma komutu: node server/socket-server.js
const { createServer } = require("http");
const { Server } = require("socket.io");
const { attachSocketHandlers } = require("./socketHandlers");

const port = process.env.PORT || 4000;
const httpServer = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  }
});

attachSocketHandlers(io);

httpServer.listen(port, () => {
  console.log(`> Socket.IO server (standalone) http://localhost:${port}`);
});
