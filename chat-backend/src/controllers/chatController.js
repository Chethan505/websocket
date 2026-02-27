const Message = require("../models/Message");

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ isPrivate: false });
  res.json(messages);
  
};
