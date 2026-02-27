import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";

function App() {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUser, setTypingUser] = useState(null);

  const currentUser = "testUser"; // define user

  useEffect(() => {
    const newSocket = io("http://localhost:8000");

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);

      newSocket.emit("join", {
        username: currentUser,
        role: "user"
      });

      newSocket.emit("join-room", "global");
    });

    newSocket.on("room-history", (history) => {
      setMessages(history);
    });

    newSocket.on("room-message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("typing", (username) => {
      setTypingUser(username);
    });

    newSocket.on("stop-typing", () => {
      setTypingUser(null);
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  const sendMessage = (text) => {
    if (!socket) return;

    socket.emit("room-message", {
      room: "global",
      sender: currentUser,
      message: text
    });
  };

  return (
    <div className="app-container">
      <Sidebar />

      <div className="chat-section">
        <ChatWindow
          messages={messages}
          currentUser={currentUser}
          typingUser={typingUser}
        />

        <MessageInput
          sendMessage={sendMessage}
          socket={socket}
          currentUser={currentUser}
        />
      </div>
    </div>
  );
}

export default App;