const { Server } = require("socket.io");
const socketLoader = require("../sockets");

const setupSocket = (server) => {
  const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

  io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);
    socketLoader(io, socket);
  });
};

module.exports = setupSocket;
