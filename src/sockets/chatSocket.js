const Message = require("../models/Message");

const onlineUsers = {};
const mutedUsers = new Set();
const rooms = {};

module.exports = (io, socket) => {

  // USER JOIN
socket.on("join", ({ username, role }) => {

  onlineUsers[socket.id] = {
    username,
    role
  };

  socket.userRole = role;
  socket.join("global");

  io.emit("online-users",
    Object.entries(onlineUsers).map(([id, user]) => ({
      socketId: id,
      username: user.username,
      role: user.role
    }))
  );
});


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




  // JOIN ROOM
 socket.on("join-room", async (data) => {

  const room = typeof data === "string" ? data : data.roomName;

  if (!room) return;

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

// =========================
// PRIVATE CHAT REQUEST
// =========================

socket.on("create-room", ({ roomName }) => {

  if (!roomName) return;

  const trimmed = roomName.trim();

  // Prevent creating "global"
  if (trimmed.toLowerCase() === "global") {
    socket.emit("room-error", "Cannot create room named Global");
    return;
  }

  // Check duplicate (case insensitive)
  const exists = Object.keys(rooms).find(
    room => room.toLowerCase() === trimmed.toLowerCase()
  );

  if (exists) {
    socket.emit("room-error", "Room already exists with this name");
    return;
  }

  rooms[trimmed] = {
    owner: socket.id,
    members: new Set([socket.id])
  };

  socket.join(trimmed);

  socket.emit("room-created", { roomName: trimmed });
});



socket.on("delete-room", async (roomName) => {
  if (!roomName || roomName === "global") return;
  if (!rooms[roomName]) return;
  await Message.deleteMany({ room: roomName });
  delete rooms[roomName];
  io.to(roomName).emit("room-deleted", roomName);

});






socket.on("private-chat-request", ({ toSocketId, fromUsername }) => {
  socket.to(toSocketId).emit("private-chat-request", {
    fromUsername,
    fromSocketId: socket.id
  });
});

socket.on("private-chat-accept", ({ fromSocketId, roomName }) => {

  socket.join(roomName);
  io.sockets.sockets.get(fromSocketId)?.join(roomName);

  io.to(roomName).emit("private-room-created", roomName);
});

socket.on("delete-room", async (roomName) => {

  if (!roomName || roomName === "global") return;

  // Delete messages
  await Message.deleteMany({ room: roomName });

  // Delete room from memory
  if (rooms[roomName]) {
    delete rooms[roomName];
  }

  // Notify everyone in that room
  io.to(roomName).emit("room-deleted", roomName);

});


socket.on("room-invite", ({ toSocketId, roomName, fromUsername }) => {

  // Send invite to target user
  socket.to(toSocketId).emit("room-invite", {
    roomName,
    fromUsername,
    fromSocketId: socket.id
  });

  // Notify sender that invite was sent
  socket.emit("invite-sent", {
    roomName,
    toSocketId
  });

});




socket.on("accept-room-invite", ({ roomName, fromSocketId }) => {

  socket.join(roomName);

  socket.emit("room-joined", roomName);

  // Notify sender that invite was accepted
  socket.to(fromSocketId).emit("invite-accepted", {
    roomName
  });

});


socket.on("ignore-room-invite", ({ fromSocketId, roomName }) => {

  socket.to(fromSocketId).emit("invite-ignored", {
    roomName
  });

});





};



