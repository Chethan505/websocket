const socket = io();

const role = localStorage.getItem("role");
const isAdmin = role === "admin" || role === "moderator";

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username) {
  window.location.href = "/login.html";
}

let currentRoom = "global";

const globalRoomCache = [];
const pendingInvites = new Set();
document.addEventListener("click", () => {
  document.querySelectorAll("[data-msg-menu]").forEach(m => {
    m.style.display = "none";
  });
});

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

// =========================
// EMOJI PANEL
// =========================

emojiBtn.addEventListener("click", () => {
  emojiPicker.classList.toggle("hidden");
});

emojiPicker.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji")) {
    msgInput.value += e.target.textContent;
    msgInput.focus();
  }
});

// Close when clicking outside
document.addEventListener("click", (e) => {
  if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.add("hidden");
  }
});



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

// 🧠 cache ONLY live global messages (not history)
if (msg.room === "global" && !msg.__isHistory) {
  globalRoomCache.push(msg);
}

  console.log("🔄 switched to room:", room);
}

// =========================
// ADD ROOM
// =========================
function addRoom(room) {

  if (!room) return;

  const existing = Array.from(roomList.children).some(
    li => li.dataset.room === room
  );

  if (existing) return;

  const li = document.createElement("li");

  li.dataset.room = room;   // 🔥 important fix

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
    alert("Cannot modify global room");
    return;
  }

  const isOwner = confirm("Are you the owner of this room?");

  if (isOwner) {

    const confirmDelete = confirm("Delete this room permanently?");
    if (!confirmDelete) return;

    socket.emit("delete-room", currentRoom);

  } else {

    const confirmLeave = confirm("Leave this room?");
    if (!confirmLeave) return;

    socket.emit("leave-room-permanently", currentRoom);
  }
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
    if (li.dataset.room === roomName) {
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


socket.on("delete-message", (messageId) => {
  const el = document.getElementById(messageId);
  if (el) el.remove();
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



socket.on("invite-accepted", ({ roomName, username }) => {
  pendingInvites.clear();

  alert(`✅ ${username || "User"} accepted your invite to "${roomName}"`);
});

socket.on("invite-ignored", ({ roomName }) => {
  pendingInvites.clear(); // stop waiting
  alert(`❌ User declined the invite to "${roomName}"`);
});

// =========================
// RENDER MESSAGE
// =========================
function renderMessage(msg) {

if (msg.room && msg.room !== currentRoom) {
  return;
}
  console.log("Incoming message:", msg); 

  const wrapper = document.createElement("li");
  wrapper.id = msg._id || Date.now();

  const isMe = msg.sender === username;
  wrapper.className = `flex ${isMe ? "justify-end" : "justify-start"} my-2`;

  const bubble = document.createElement("div");
  bubble.style.pointerEvents = "auto";

  bubble.style.position = "relative";
  bubble.className = `
    relative max-w-xs px-4 py-2 rounded-lg text-sm shadow
    ${isMe ? "bg-green-500 text-white" : "bg-white text-gray-800"}
  `;




  const displayName = isMe ? "You" : (msg.sender || "User");

  // ✅ TEXT MESSAGE (safe check)
  if (!msg.type || msg.type === "text") {
    bubble.innerHTML = `<b>${displayName}</b><br>${msg.message || ""}`;
    bubble.style.overflow = "visible";

  }

  // ✅ IMAGE
  else if (msg.type === "image" && msg.fileUrl) {
    bubble.innerHTML = `
      <b>${displayName}</b><br>
      <img src="${msg.fileUrl}" class="rounded mt-1 max-h-40">
    `;
  }

  // ✅ AUDIO
  else if (msg.type === "audio" && msg.fileUrl) {
    bubble.innerHTML = `
      <b>${displayName}</b><br>
      <audio controls src="${msg.fileUrl}" class="mt-1"></audio>
    `;
  }

  // ✅ FILE
  else if (msg.type === "file" && msg.fileUrl) {
    bubble.innerHTML = `
      <b>${displayName}</b><br>
      <a href="${msg.fileUrl}" download class="underline">
        ${msg.fileName || "Download file"}
      </a>
    `;
  }
 
  // ❗ FALLBACK (VERY IMPORTANT)
  else {
    bubble.innerHTML = `<b>${displayName}</b><br>Unsupported message`;
    console.warn("Unknown message type:", msg.type);
  }
// =========================
// 🗑 THREE DOT MENU (SAFE)
// =========================
const menuBtn = document.createElement("button");
menuBtn.innerText = "⋮";
menuBtn.style.position = "absolute";
menuBtn.style.top = "4px";
menuBtn.style.right = "6px";
menuBtn.style.fontSize = "14px";
menuBtn.style.cursor = "pointer";
menuBtn.style.zIndex = "9999";
menuBtn.style.background = "transparent";
menuBtn.style.border = "none";

bubble.appendChild(menuBtn);

const menu = document.createElement("div");
menu.style.position = "absolute";
menu.style.top = "22px";
menu.style.right = "0";
menu.style.background = "#ffffff";
menu.style.border = "1px solid #ddd";
menu.style.borderRadius = "6px";
menu.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";
menu.style.fontSize = "13px";
menu.style.display = "none";
menu.style.zIndex = "10000";
menu.style.minWidth = "150px";
menu.style.color = "#111"; // 🔥 VERY IMPORTANT

bubble.appendChild(menu);

// toggle
menuBtn.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();
  menu.style.display = menu.style.display === "none" ? "block" : "none";
};

// ✅ Delete for me (ALWAYS)
const deleteMe = document.createElement("div");
deleteMe.innerText = "Delete for me";
deleteMe.style.padding = "8px 12px";
deleteMe.style.cursor = "pointer";
deleteMe.style.color = "#111";

deleteMe.onclick = () => wrapper.remove();

menu.appendChild(deleteMe);

// ✅ Delete for everyone (ONLY sender)
if (msg.sender === username) {
  const deleteAll = document.createElement("div");
  deleteAll.innerText = "Delete for everyone";
  deleteAll.style.padding = "8px 12px";
  deleteAll.style.cursor = "pointer";
  deleteAll.style.color = "red";

  deleteAll.onclick = () => {
    socket.emit("delete-message", {
      messageId: msg._id,
      username
    });
  };

  menu.appendChild(deleteAll);
}

console.log("menu children:", menu.children.length);

  wrapper.appendChild(bubble);

  if (!messages) {
    console.error("❌ messages container not found");
    return;
  }

// 🧠 cache ONLY global room messages
if (msg.room === "global") {
  globalRoomCache.push(msg);
}

  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}

// --------------------------------
// render message
// --------------------------------
socket.on("room-message", (msg) => {
  console.log("📩 room-message received:", msg);
  renderMessage(msg);
});

// when server sends file message
socket.on("file-message", (msg) => {
  console.log("📎 file-message received:", msg);
  renderMessage(msg);
});

// =========================
// 🔥 ROOM HISTORY (MISSING PIECE)
// =========================
socket.on("room-history", (history) => {
  console.log("📚 room-history received:", history);

  if (!Array.isArray(history)) return;

  // ❗ ONLY allow history for global room
  if (currentRoom !== "global") {
    console.log("⛔ skipping private room history");
    return;
  }

  messages.innerHTML = "";

  history.forEach(msg => {
    renderMessage({ ...msg, __isHistory: true }); // 🔥 tag history
  });
});
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

  // 🟢 mark waiting
  pendingInvites.add(user.socketId);

  socket.emit("room-invite", {
    toSocketId: user.socketId,
    roomName: currentRoom,
    fromUsername: username
  });

  // 🟢 optional UX popup
  alert(`Invite sent to ${user.username}. Waiting for response...`);
};

    li.appendChild(left);
    li.appendChild(inviteBtn);
    userList.appendChild(li);
  });
});

socket.on("room-joined", (roomName) => {
  console.log("✅ joined room:", roomName);
});

//--------------------------------//
//  listener for leaving the room //
//--------------------------------//
socket.on("room-left", (roomName) => {

  const items = document.querySelectorAll("#roomList li");

  items.forEach(li => {
    if (li.dataset.room === roomName) {
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


