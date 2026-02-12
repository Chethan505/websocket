const Message = require("../models/Message");

const onlineUsers = {}; 

module.exports = (io, socket) => {

  socket.on("join", (username) => {
    onlineUsers[socket.id] = username;
    socket.join("global");

    io.emit("online-users", Object.entries(onlineUsers).map(([id, name]) => ({
      socketId: id,
      username: name
    })));
  });

 
  socket.on("join-room", async (room) => {
    socket.join(room);

    const history = await Message.find({ room });
    socket.emit("room-history", history);
  });

 
  socket.on("leave-room", (room) => {
    socket.leave(room);
  });

 
  socket.on("room-message", async ({ room, sender, message }) => {
    const msg = await Message.create({
      sender,
      message,
      room,
      isPrivate: false
    });

    io.to(room).emit("room-message", msg);
  });
  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    io.emit("online-users", Object.entries(onlineUsers).map(([id, name]) => ({
      socketId: id,
      username: name
    })));
  })

   socket.on("file-message", async (data) => {
    const msg = await Message.create({
      sender: data.sender,
      receiver: data.receiver || null,
      type: data.type,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      isPrivate: data.isPrivate
    });

    if (data.isPrivate) {
      socket.to(data.toSocketId).emit("file-message", msg);
      socket.emit("file-message", msg);
    } else {
      io.emit("file-message", msg);
    }
  });



  
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

socket.on("message-seen", async (messageId) => {
  await Message.findByIdAndUpdate(messageId, {
    status: "seen"
  });

  socket.broadcast.emit("message-seen", messageId);
});



  socket.on("mute-user", ({ targetSocketId }) => {
    mutedUsers.add(targetSocketId);
    socket.to(targetSocketId).emit("muted");
  });

  socket.on("kick-user", ({ targetSocketId }) => {
    socket.to(targetSocketId).emit("kicked");
  });

  socket.on("admin-message-delete", ({ messageId }) => {
    io.emit("delete-message", messageId);
  });

  socket.on("room-message", async (data) => {
    if (mutedUsers.has(socket.id)) return;

    // existing room-message logic
  });



};


