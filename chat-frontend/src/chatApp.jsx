import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import MessageInput from "./components/MessageInput";
import Login from "./pages/Login";
import "./index.css"; 



function ChatApp({ user })  {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUser, setTypingUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([
    { roomName: "global", owner: null }
  ]);
  const [currentRoom, setCurrentRoom] = useState("global");


useEffect(() => {
  setCurrentUser(user.username);
}, [user]);

useEffect(()=>{

  
  const newSocket = io("http://localhost:8000", {
    auth: {
    token: localStorage.getItem("token")
  }
});
   

    newSocket.off("room-history").on("room-history", (history) => {
  setMessages(history || []);
});
    if (!currentUser) return;


    newSocket.on("connect", () => {
      newSocket.emit("join", {
        username: currentUser,
        role: "user"
      });





      newSocket.emit("join-room", currentRoom);
    });
    newSocket.on("online-users", (users) => {
      setOnlineUsers(users);
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
        `${fromUsername} invited you to join ${roomName}`
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
    
    newSocket.on("room-left", (roomName) => {
      
      setRooms(prev =>
        prev.filter(room => room.roomName !== roomName)
      );
      
      setCurrentRoom("global");
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
      
      setRooms(prev =>
        prev.filter(room => room.roomName !== roomName)
      );

      setMessages([]); // clear chat history
      
      setCurrentRoom("global");
      
    });
    
    setSocket(newSocket);
  
    return () => newSocket.disconnect();
  }, [currentUser]);
    
 


useEffect(() => {
  if (!socket) return;

  // 1. Clear old room messages
  setMessages([]);

  // 2. Join the new room
  socket.emit("join-room", currentRoom);

}, [currentRoom, socket]);


  const sendMessage = (text) => {
    if (!socket) 
      return;



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

    if (currentRoom === "global") {
      alert("Users cannot be invited to the global room.");
      return;
    }

    if (!socket) return;

    socket.emit("room-invite", {
      toSocketId,
      roomName: currentRoom,
      fromUsername: currentUser
    });

    alert(`Invite sent to ${username}`);
  };

  const leaveRoom = (roomName) => {
    if (!socket) return;

    socket.emit("leave-room-permanently", roomName);
  };

  const changeRoom = (roomName) => {
    setCurrentRoom(roomName);
    setMessages([]); // clear old messages
    socket.emit("join-room", roomName);
  };

  return (
    <div className="app-container">
      <Sidebar
        onlineUsers={onlineUsers}
        rooms={rooms}
        currentRoom={currentRoom}
        setCurrentRoom={changeRoom}
        createRoom={createRoom}
        deleteRoom={deleteRoom}
        currentUser={currentUser}
        inviteUser={inviteUser} />

      <div className="chat-section">
        <ChatWindow
          messages={messages}
          currentUser={currentUser}
          typingUser={typingUser}
          currentRoom={currentRoom}
          leaveRoom={leaveRoom}
          isOwner={
            rooms.find(r => r.roomName === currentRoom)?.owner === currentUser
          }
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

export default ChatApp;