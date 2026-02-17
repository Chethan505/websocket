const socket = io();

const role = localStorage.getItem("role");
const isAdmin = role === "admin" || role === "moderator";

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username) {
  window.location.href = "/login.html";
}

let currentRoom = "global";

// =========================
// INITIAL JOIN
// =========================
socket.emit("join", {
  username: username,
  role: role
});

socket.emit("join-room", currentRoom);

// =========================
// DOM ELEMENTS
// =========================
const messages = document.getElementById("messages");
const roomTitle = document.getElementById("roomTitle");
const roomList = document.getElementById("roomList");
const userList = document.getElementById("userList");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const msgInput = document.getElementById("msg");
const roomInput = document.getElementById("roomInput");
document.getElementById("logoutBtn").addEventListener("click", logout);


let selectedFile = null;
filePreview.innerText = "";

// =========================
// ENTER TO SEND MESSAGE
// =========================
msgInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

// =========================
// ENTER TO CREATE ROOM
// =========================
roomInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    createRoom();
  }
});

// =========================
// AUTO RESIZE TEXTAREA
// =========================
msgInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// =========================
// CREATE ROOM
// =========================
function createRoom() {
  const room = roomInput.value.trim();
  if (!room) return;

  socket.emit("create-room", { roomName: room });
  roomInput.value = "";
}

socket.on("room-error", (message) => {
  alert(message);
});

// =========================
// SWITCH ROOM
// =========================
function switchRoom(room) {
  socket.emit("leave-room", currentRoom);
  currentRoom = room;
  socket.emit("join-room", room);

  roomTitle.innerText = `Room: ${room}`;
  messages.innerHTML = "";
}

// =========================
// ADD ROOM
// =========================
function addRoom(room) {

  if (!room) return;

  const existing = Array.from(roomList.children).some(
    li => li.innerText.trim() === room
  );

  if (existing) return;

  const li = document.createElement("li");

  li.className = `
    flex items-center gap-2 
    bg-pink-100 text-pink-700 
    px-3 py-2 rounded-lg 
    cursor-pointer 
    hover:bg-pink-200 
    transition
  `;

  li.innerHTML = `
    <span>🔒</span>
    <span>${room}</span>
  `;

  li.onclick = () => switchRoom(room);

  roomList.appendChild(li);
}

// =========================
// SEND MESSAGE
// =========================
async function send() {

  const text = msgInput.value.trim();

  if (selectedFile) {
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      const type = selectedFile.type.startsWith("image")
        ? "image"
        : selectedFile.type.startsWith("audio")
        ? "audio"
        : "file";

      socket.emit("file-message", {
        sender: username,
        type,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        room: currentRoom
      });

    } catch (err) {
      console.error("Upload error:", err);
    }

    selectedFile = null;
    fileInput.value = "";
    filePreview.innerText = "";
    return;
  }

  if (text) {
    socket.emit("room-message", {
      room: currentRoom,
      sender: username,
      message: text
    });

    msgInput.value = "";
    msgInput.style.height = "auto";
  }
}

// =========================
// DELETE ROOM
// =========================
function deleteRoom() {

  if (currentRoom === "global") {
    alert("Cannot delete global room");
    return;
  }

  const confirmDelete = confirm("Delete this room?");
  if (!confirmDelete) return;

  socket.emit("delete-room", currentRoom);
}

// =========================
// LOGOUT
// =========================
function logout() {

  socket.emit("user-logout");

  localStorage.clear();

  socket.disconnect();

  window.location.href = "/login.html";
}

// =========================
// FILE SELECTION
// =========================
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  selectedFile = file;
  filePreview.innerText = `Selected: ${file.name}`;
});

// =========================
// ROOM LISTENERS
// =========================
socket.on("room-created", ({ roomName }) => {
  addRoom(roomName);
  switchRoom(roomName);
});

socket.on("room-joined", (roomName) => {
  addRoom(roomName);
  switchRoom(roomName);
});

socket.on("room-deleted", (roomName) => {

  const items = document.querySelectorAll("#roomList li");

  items.forEach(li => {
    if (li.innerText.trim() === roomName) {
      li.remove();
    }
  });

  if (currentRoom === roomName) {
    currentRoom = "global";
    socket.emit("join-room", "global");
    roomTitle.innerText = "Room: global";
    messages.innerHTML = "";
  }
});

// 🔥 FIXED BLOCK (only correction made)
socket.on("existing-rooms", (roomsFromServer) => {

  if (!Array.isArray(roomsFromServer)) return;

  roomsFromServer.forEach(room => {
    addRoom(room);
  });

});

// =========================
// INVITES
// =========================
socket.on("room-invite", ({ roomName, fromUsername, fromSocketId }) => {

  const accept = confirm(
    `${fromUsername} invited you to join "${roomName}". Accept?`
  );

  if (accept) {

    socket.emit("accept-room-invite", {
      roomName,
      fromSocketId
    });

  } else {

    socket.emit("ignore-room-invite", {
      roomName,
      fromSocketId
    });

  }
});

socket.on("invite-sent", ({ roomName }) => {
  alert(`Invite sent for "${roomName}"`);
});

socket.on("invite-accepted", ({ roomName }) => {
  alert(`User accepted invite to "${roomName}"`);
});

socket.on("invite-ignored", ({ roomName }) => {
  alert(`User ignored invite to "${roomName}"`);
});

// =========================
// RENDER MESSAGE
// =========================
function renderMessage(msg) {

  const wrapper = document.createElement("li");
  wrapper.id = msg._id;

  const isMe = msg.sender === username;
  wrapper.className = `flex ${isMe ? "justify-end" : "justify-start"} my-2`;

  const bubble = document.createElement("div");
  bubble.className = `
    relative max-w-xs px-4 py-2 rounded-lg text-sm shadow
    ${isMe ? "bg-green-500 text-white" : "bg-white text-gray-800"}
  `;

  const displayName = isMe ? "You" : msg.sender;
  bubble.innerHTML = `<b>${displayName}</b><br>${msg.message || ""}`;

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

socket.on("room-history", (msgs) => {
  msgs.forEach(renderMessage);
});

socket.on("file-message", renderMessage);
socket.on("room-message", renderMessage);

// =========================
// ONLINE USERS
// =========================
socket.on("online-users", (users) => {

  userList.innerHTML = "";

  users.forEach(user => {

    if (!user || user.username === username) return;

    const li = document.createElement("li");
    li.className = "flex justify-between items-center p-2 hover:bg-pink-50 rounded-lg transition";

    const left = document.createElement("span");
    left.innerText = user.username;

    const inviteBtn = document.createElement("button");
    inviteBtn.innerText = "💬";
    inviteBtn.className = "text-xs text-blue-500 hover:text-blue-700";

    inviteBtn.onclick = () => {

      if (currentRoom === "global") {
        alert("Cannot invite users to Global room");
        return;
      }

      socket.emit("room-invite", {
        toSocketId: user.socketId,
        roomName: currentRoom,
        fromUsername: username
      });
    };

    li.appendChild(left);
    li.appendChild(inviteBtn);
    userList.appendChild(li);
  });
});
