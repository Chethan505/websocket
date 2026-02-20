const Message = require("../models/Message");

const onlineUsers = {};
const mutedUsers = new Set();
const rooms = {};

module.exports = (io, socket) => {

  // =========================
  // USER JOIN
  // =========================
  socket.on("join", ({ username, role }) => {

    // 🔥 STORE USERNAME ON SOCKET (CRITICAL FIX)
    socket.username = username;
    socket.userRole = role;

    // Disconnect previous session
    for (const id in onlineUsers) {
      if (onlineUsers[id].username === username) {
        io.sockets.sockets.get(id)?.disconnect(true);
      }
    }

    onlineUsers[socket.id] = { username, role };

    io.emit("online-users",
      Object.entries(onlineUsers).map(([id, user]) => ({
        socketId: id,
        username: user.username,
        role: user.role
      }))
    );

    // 🔥 SEND ONLY ROOMS THIS USER BELONGS TO
    const userRooms = Object.keys(rooms).filter(roomName =>
      rooms[roomName].members.has(socket.username)
    );

    socket.emit("existing-rooms", userRooms);
  });


  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {

    delete onlineUsers[socket.id];

    io.emit("online-users",
      Object.entries(onlineUsers).map(([id, user]) => ({
        socketId: id,
        username: user.username,
        role: user.role
      }))
    );
  });


  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join-room", async (data) => {

    if (!data) return;

    const room = typeof data === "string" ? data : data.roomName;

    if (!room) return;

    socket.join(room);

    const history = await Message.find({ room });
    socket.emit("room-history", history);
  });


  // =========================
  // LEAVE ROOM
  // =========================
  socket.on("leave-room", (room) => {
    socket.leave(room);
  });


  // =========================
  // ROOM MESSAGE
  // =========================
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


  // =========================
  // FILE MESSAGE
  // =========================
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


  // =========================
  // DELETE MESSAGE
  // =========================
  socket.on("delete-message", async ({ messageId, username }) => {

    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      if (
        message.sender === username ||
        socket.userRole === "admin" ||
        socket.userRole === "moderator"
      ) {
        await Message.findByIdAndDelete(messageId);
        io.to(message.room).emit("delete-message", messageId);
      }

    } catch (err) {
      console.error("Delete error:", err);
    }
  });


  // =========================
  // CREATE ROOM
  // =========================
  socket.on("create-room", ({ roomName }) => {

    if (!roomName) return;

    const trimmed = roomName.trim();

    if (trimmed.toLowerCase() === "global") {
      socket.emit("room-error", "Cannot create room named Global");
      return;
    }

    const exists = Object.keys(rooms).some(
      room => room.toLowerCase() === trimmed.toLowerCase()
    );

    if (exists) {
      socket.emit("room-error", "Room already exists with this name");
      return;
    }

    // 🔥 FIX: use trimmed key + username
    rooms[trimmed] = {
      owner: socket.username,
      members: new Set([socket.username])
    };

    socket.join(trimmed);

    socket.emit("room-created", { roomName: trimmed });
  });


  // =========================
  // DELETE ROOM (OWNER ONLY)
  // =========================
  socket.on("delete-room", async (roomName) => {

    if (!roomName || roomName === "global") return;

    if (!rooms[roomName]) return;

    // 🔥 OWNER CHECK FIX
    if (rooms[roomName].owner !== socket.username) {
      socket.emit("room-error", "Only the room owner can delete this room");
      return;
    }

    await Message.deleteMany({ room: roomName });

    delete rooms[roomName];

    io.to(roomName).emit("room-deleted", roomName);
  });


  // =========================
  // ROOM INVITE
  // =========================
  socket.on("room-invite", ({ toSocketId, roomName, fromUsername }) => {

    if (!toSocketId || !roomName) return;

    socket.to(toSocketId).emit("room-invite", {
      roomName,
      fromUsername,
      fromSocketId: socket.id
    });

    socket.emit("invite-sent", { roomName });
  });


  // =========================
  // ACCEPT ROOM INVITE
  // =========================
  socket.on("accept-room-invite", ({ roomName }) => {

    if (!rooms[roomName]) return;

    rooms[roomName].members.add(socket.username);

    socket.join(roomName);

    socket.emit("room-joined", roomName);
  });


  // =========================
  // LEAVE ROOM (NOT DELETE)
  // =========================
 socket.on("leave-room-permanently", (roomName) => {

  if (!rooms[roomName]) return;

  rooms[roomName].members.delete(socket.username);

  socket.leave(roomName);

  socket.emit("room-left", roomName);

});



  // =========================
  // USER LOGOUT (DELETE OWN ROOMS ONLY)
  // =========================
  socket.on("user-logout", () => {

    for (const roomName in rooms) {

      // 🔥 FIX: compare with username not socket.id
      if (rooms[roomName].owner === socket.username) {

        delete rooms[roomName];

        io.emit("room-deleted", roomName);
      }
    }

    delete onlineUsers[socket.id];

    io.emit("online-users",
      Object.entries(onlineUsers).map(([id, user]) => ({
        socketId: id,
        username: user.username,
        role: user.role
      }))
    );
  });

};
