import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";

function App() {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [rooms, setRooms] = useState(["global"]);
  const [currentRoom, setCurrentRoom] = useState("global");

  const currentUser = "testUser"; // define user

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    

    newSocket.on("connect", () => {
      console.log("Connected:", newSocket.id);

      newSocket.emit("join", {
        username: currentUser,
        role: "user"
      });

      newSocket.emit("join-room", currentRoom);
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
    newSocket.on("online-users", (users) => {
      setOnlineUsers(users);
    });

    newSocket.on("existing-rooms", (roomList) => {
      if (roomList.length > 0) {
        setRooms(["global", ...roomList]);
      }
    });


    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
  if (!socket) return;

  setMessages([]);
  socket.emit("join-room", currentRoom);
}, [currentRoom]);

  const sendMessage = (text) => {
    if (!socket) return;
  

    socket.emit("room-message", {
      room: currentRoom,
      sender: currentUser,
      message: text
    });
  };

  return (
    <div className="app-container">
      <Sidebar
      onlineUsers={onlineUsers}
      rooms={rooms}
      currentRoom={currentRoom}
      setCurrentRoom={setCurrentRoom}/>

      <div className="chat-section">
        <ChatWindow
          messages={messages}
          currentUser={currentUser}
          typingUser={typingUser}
          currentRoom={currentRoom}
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