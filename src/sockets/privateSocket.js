const Message = require("../models/Message");

module.exports = (io, socket) => {

  socket.on("private-message", async (data) => {
    const msg = await Message.create({
      sender: data.from,
      receiver: data.to,
      message: data.message,
      isPrivate: true
    });

    
    socket.to(data.toSocketId).emit("private-message", msg);

    
    socket.emit("private-message", msg);
  });

};
