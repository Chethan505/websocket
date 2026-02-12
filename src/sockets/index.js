const chatSocket = require("./chatSocket");
const privateSocket = require("./privateSocket");

module.exports = (io, socket) => {
  chatSocket(io, socket);
  privateSocket(io, socket);
};
