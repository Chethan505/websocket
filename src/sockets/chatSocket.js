const Message = require("../models/Message");

const onlineUsers = {};
const mutedUsers = new Set();

module.exports = (io, socket) => {

  // USER JOIN
  socket.on("join", ({ username, role }) => {
  onlineUsers[socket.id] = username;
  socket.userRole = role;   // 🔥 Save role in socket
  socket.join("global");


    io.emit(
      "online-users",
      Object.entries(onlineUsers).map(([id, name]) => ({
        socketId: id,
        username: name,
      }))
    );
  });

  // JOIN ROOM
  socket.on("join-room", async (room) => {
    socket.join(room);

    const history = await Message.find({ room });
    socket.emit("room-history", history);
  });

  // LEAVE ROOM
  socket.on("leave-room", (room) => {
    socket.leave(room);
  });

  // ROOM MESSAGE
  socket.on("room-message", async ({ room, sender, message }) => {
    if (mutedUsers.has(socket.id)) return;

    const msg = await Message.create({
      sender,
      message,
      room,
      isPrivate: false,
    });

    io.to(room).emit("room-message", msg);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];

    io.emit(
      "online-users",
      Object.entries(onlineUsers).map(([id, name]) => ({
        socketId: id,
        username: name,
      }))
    );
  });

  // FILE MESSAGE
socket.on("file-message", async (data) => {

  if (mutedUsers.has(socket.id)) {
    socket.emit("muted");
    return;
  }

  const msg = await Message.create({
    sender: data.sender,
    type: data.type,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    room: data.room || "global",
    isPrivate: false
  });

  io.to(data.room).emit("file-message", msg);
});


  // TYPING
  socket.on("typing", ({ username, isPrivate, toSocketId }) => {
    if (isPrivate && toSocketId) {
      socket.to(toSocketId).emit("typing", { username });
    } else {
      socket.broadcast.emit("typing", { username });
    }
  });

  socket.on("stop-typing", ({ isPrivate, toSocketId }) => {
    if (isPrivate && toSocketId) {
      socket.to(toSocketId).emit("stop-typing");
    } else {
      socket.broadcast.emit("stop-typing");
    }
  });

  // MESSAGE SEEN
  socket.on("message-seen", async (messageId) => {
    await Message.findByIdAndUpdate(messageId, {
      status: "seen",
    });

    socket.broadcast.emit("message-seen", messageId);
  });

  // ADMIN CONTROLS
  socket.on("mute-user", ({ targetSocketId }) => {
    mutedUsers.add(targetSocketId);
    socket.to(targetSocketId).emit("muted");
  });

  socket.on("kick-user", ({ targetSocketId }) => {
    socket.to(targetSocketId).emit("kicked");
  });

 socket.on("delete-message", async ({ messageId, username }) => {

  try {
    const message = await Message.findById(messageId);
    if (!message) return;

    // Allow if user owns message OR admin
    if (message.sender === username || socket.userRole === "admin" || socket.userRole === "moderator") {

      await Message.findByIdAndDelete(messageId);

      io.to(message.room).emit("delete-message", messageId);
    }

  } catch (err) {
    console.error("Delete error:", err);
  }

});


};
