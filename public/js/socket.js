const socket = io();
const role = localStorage.getItem("role");
const isAdmin = role === "admin" || role === "moderator";


const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username) {
  window.location.href = "/login.html";
}


let currentRoom = "global";

socket.emit("join", username);
socket.emit("join-room", currentRoom);

const messages = document.getElementById("messages");
const roomTitle = document.getElementById("roomTitle");
const roomList = document.getElementById("roomList");


function createRoom() {
  const room = document.getElementById("roomInput").value.trim();
  if (!room) return;

  addRoom(room);
  switchRoom(room);
  document.getElementById("roomInput").value = "";
}


function switchRoom(room) {
  socket.emit("leave-room", currentRoom);
  currentRoom = room;
  socket.emit("join-room", room);

  roomTitle.innerText = `Room: ${room}`;
  messages.innerHTML = "";
}


function addRoom(room) {
  const li = document.createElement("li");
  li.innerText = room;
  li.onclick = () => switchRoom(room);
  roomList.appendChild(li);
}


function send() {
  const text = document.getElementById("msg").value;
  if (!text) return;

  socket.emit("room-message", {
    room: currentRoom,
    sender: username,
    message: text
  });

  document.getElementById("msg").value = "";
}


socket.on("room-history", (msgs) => {
  msgs.forEach(renderMessage);
});


socket.on("room-message", (msg) => {
  renderMessage(msg);
});


function renderMessage(msg) {
 

  const li = document.createElement("li");

   if (isAdmin) {
  const del = document.createElement("span");
  del.innerText = " ❌";
  del.style.cursor = "pointer";
  del.onclick = () => {
    socket.emit("admin-message-delete", { messageId: msg._id });
  };
  li.appendChild(del);
}

  const isMe = msg.sender === username;

  li.className = `max-w-xs px-3 py-2 rounded-lg text-sm ${
    isMe
      ? "ml-auto bg-green-500 text-white"
      : "mr-auto bg-white text-gray-800"
  } shadow`;

  if (msg.type === "image") {
    li.innerHTML = `<b>${msg.sender}</b><br>
      <img src="${msg.fileUrl}" class="rounded mt-1 max-h-40">`;
  }
  else if (msg.type === "audio") {
    li.innerHTML = `<b>${msg.sender}</b><br>
      <audio controls src="${msg.fileUrl}" class="mt-1"></audio>`;
  }
  else if (msg.type === "file") {
    li.innerHTML = `<b>${msg.sender}</b><br>
      <a href="${msg.fileUrl}" download class="underline">
        ${msg.fileName}
      </a>`;
  }
  else {
    li.innerHTML = `<b>${msg.sender}</b><br>${msg.message}`;
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}



const userList = document.getElementById("userList");

socket.on("online-users", (users) => {
  userList.innerHTML = "";

  users.forEach(user => {
    if (user.username === username) return;

    const li = document.createElement("li");
    li.className = "cursor-pointer hover:text-blue-600";
    li.innerText = user.username;

    userList.appendChild(li);
  });
});


function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

socket.on("online-users", (users) => {
  userList.innerHTML = "";

  users.forEach(user => {
    const li = document.createElement("li");
    li.className = "flex justify-between items-center";

    li.innerHTML = `<span>${user.username}</span>`;

    if (isAdmin) {
      const btn = document.createElement("button");
      btn.innerText = "Kick";
      btn.className = "text-xs text-red-500";
      btn.onclick = () => {
        socket.emit("kick-user", { targetSocketId: user.socketId });
      };
      li.appendChild(btn);
    }

    userList.appendChild(li);
  });
});


socket.on("muted", () => {
  alert("You are muted by admin");
});

socket.on("kicked", () => {
  alert("You were kicked from chat");
  window.location.href = "/login.html";
});

socket.on("delete-message", (id) => {
  const msg = document.getElementById(id);
  if (msg) msg.remove();
});

