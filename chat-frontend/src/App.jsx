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
  const [rooms, setRooms] = useState([
  { roomName: "global", owner: null }
]);
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

   
newSocket.on("room-created", ({ roomName, owner }) => {
  setRooms(prev => {
    if (prev.some(r => r.roomName === roomName)) return prev;
    return [...prev, { roomName, owner }];
  });



  setCurrentRoom(roomName);
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
  setRooms([
    { roomName: "global", owner: null },
    ...roomList
  ]);
});

    newSocket.on("room-error", (message) => {
    alert(message);
    });

  newSocket.on("room-deleted", (roomName) => {
  console.log("Room deleted event received:", roomName);

  setRooms((prev) =>
    prev.filter((roomObj) => roomObj.roomName !== roomName)
  );

  setCurrentRoom((prevRoom) =>
    prevRoom === roomName ? "global" : prevRoom
  );
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

  const createRoom = () => {
  const roomName = prompt("Enter room name:");
  if (!roomName || !socket) return;

  socket.emit("create-room", { roomName });
};

const deleteRoom = (roomName) => {
  console.log("Deleting room:", roomName);  // 👈 ADD THIS

  if (!socket) return;

  const confirmDelete = window.confirm(
    `Delete room "${roomName}"?`
  );

  if (!confirmDelete) return;

  socket.emit("delete-room", roomName);
};

  return (
    <div className="app-container">
      <Sidebar
      onlineUsers={onlineUsers}
      rooms={rooms}
      currentRoom={currentRoom}
      setCurrentRoom={setCurrentRoom}
      createRoom={createRoom}
      deleteRoom={deleteRoom}
      currentUser={currentUser}/>

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