const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String, // for private chat
  message: String,

  type: {
    type: String,
    enum: ["text", "image", "audio", "file"],
    default: "text"
  },

  fileUrl: String,
  fileName: String,

  isPrivate: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  status: {
  type: String,
  enum: ["sent", "seen"],
  default: "sent"
},
room: {
  type: String,
  default: "global"
}

});



module.exports = mongoose.model("Message", messageSchema);
