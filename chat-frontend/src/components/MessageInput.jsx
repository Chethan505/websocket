import { useState } from "react";

function MessageInput({ sendMessage, socket, currentUser }) {
  const [text, setText] = useState("");

  const handleTyping = (value) => {
    setText(value);

    socket.emit("typing", {
      room: "global",
      username: currentUser
    });

    setTimeout(() => {
      socket.emit("stop-typing", { room: "global" });
    }, 1000);
  };

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    socket.emit("stop-typing", { room: "global" });
  };

  return (
    <div className="message-input">
      <input className="message-input-text"
        value={text}
        onChange={(e) => handleTyping(e.target.value)}
         onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
      />
     
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default MessageInput;