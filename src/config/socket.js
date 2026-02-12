const { Server } = require("socket.io");
const socketLoader = require("../sockets");

const setupSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);
    socketLoader(io, socket);
  });
};

module.exports = setupSocket;
