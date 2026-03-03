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
  const [currentUser, setCurrentUser] = useState(() => {
  return sessionStorage.getItem("username") || null;
});
  const [rooms, setRooms] = useState([
  { roomName: "global", owner: null }
]);
  const [currentRoom, setCurrentRoom] = useState("global");

useEffect(() => {
  if (!currentUser) {
    let username = "";

    while (!username) {
      username = prompt("Enter username:");
    }

    sessionStorage.setItem("username", username);
    setCurrentUser(username);
  }
}, [currentUser]);

  

  useEffect(() => {
    const newSocket = io("http://localhost:8000");
    if (!currentUser) return;
    

    newSocket.on("connect", () => {
    newSocket.emit("join", {
      username: currentUser,
      role: "user"
    });

 

  newSocket.on("online-users", (users) => {
    setOnlineUsers(users);
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
  

    newSocket.on("existing-rooms", (roomList) => {
  setRooms([
    { roomName: "global", owner: null },
    ...roomList
  ]);
});

newSocket.on("room-invite", ({ roomName, fromUsername, fromSocketId }) => {
  const accept = window.confirm(
    `${fromUsername} invited you to join room "${roomName}". Accept?`
  );

  if (accept) {
    newSocket.emit("accept-room-invite", {
      roomName,
      fromSocketId
    });
  } else {
    newSocket.emit("ignore-room-invite", {
      roomName,
      fromSocketId
    });
  }
});

newSocket.on("room-joined", (roomName) => {
  setRooms((prev) => {
    if (prev.some((r) => r.roomName === roomName)) return prev;
    return [...prev, { roomName, owner: null }];
  });

  setCurrentRoom(roomName);
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
  }, [currentUser]);

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

const inviteUser = (toSocketId, username) => {
  if (!socket) return;

  socket.emit("room-invite", {
    toSocketId,
    roomName: currentRoom,
    fromUsername: currentUser
  });

  alert(`Invite sent to ${username}`);
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
      currentUser={currentUser}
      inviteUser={inviteUser}/>

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