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

  document.addEventListener("click", () => {
  document.querySelectorAll(".msg-menu").forEach(m => {
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
menuBtn.style.opacity = "0.65";
menuBtn.style.padding = "2px 6px";
menuBtn.style.borderRadius = "6px";
menuBtn.style.transition = "all 0.15s ease";

menuBtn.onmouseenter = () => {
  menuBtn.style.background = "rgba(255,255,255,0.25)";
  menuBtn.style.opacity = "1";
};

menuBtn.onmouseleave = () => {
  menuBtn.style.background = "transparent";
  menuBtn.style.opacity = "0.65";
};

bubble.appendChild(menuBtn);
const isDownloadable = !!msg.fileUrl;
const isGlobalRoom = msg.room === "global";

const menu = document.createElement("div");
menu.classList.add("msg-menu");
menu.style.position = "absolute";
menu.style.top = "22px";
menu.style.right = "0";
menu.style.background = "#fff0f6"; // 🌸 light pink theme
menu.style.border = "1px solid #fbcfe8";
menu.style.borderRadius = "12px";
menu.style.boxShadow = "0 10px 25px rgba(236, 72, 153, 0.18)";
menu.style.fontSize = "13px";
menu.style.display = "none";
menu.style.zIndex = "10000";
menu.style.minWidth = "170px";
menu.style.padding = "6px 0";
menu.style.backdropFilter = "blur(6px)";

bubble.appendChild(menu);

// toggle
menuBtn.onclick = (e) => {
  e.preventDefault();
  e.stopPropagation();

  // 🔴 close all other menus first
  document.querySelectorAll(".msg-menu").forEach(m => {
    if (m !== menu) m.style.display = "none";
  });

  // 🔁 toggle this one
  menu.style.display = menu.style.display === "none" ? "block" : "none";
};

// =========================
// ⬇️ DOWNLOAD (GLOBAL ONLY)
// =========================
if (isDownloadable && isGlobalRoom) {
  const downloadItem = document.createElement("div");
  downloadItem.innerText =
  msg.type === "image"
    ? "Download image"
    : msg.type === "audio"
    ? "Download audio"
    : "Download file";
downloadItem.style.padding = "10px 14px";
downloadItem.style.cursor = "pointer";
downloadItem.style.color = "#9d174d";
downloadItem.style.fontWeight = "500";
downloadItem.style.transition = "all 0.15s ease";

downloadItem.onmouseenter = () => {
  downloadItem.style.background = "#ffe4f1";
};

downloadItem.onmouseleave = () => {
  downloadItem.style.background = "transparent";
};

  downloadItem.onclick = () => {
    menu.style.display = "none";

    // create temporary link
    const a = document.createElement("a");
    a.href = msg.fileUrl;
    a.download = msg.fileName || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  menu.appendChild(downloadItem);
}





// =========================
// 🗑 MAIN DELETE BUTTON
// =========================
const deleteBtn = document.createElement("div");
deleteBtn.innerText = "Delete";
deleteBtn.style.padding = "10px 14px";
deleteBtn.style.cursor = "pointer";
deleteBtn.style.color = "#be185d";
deleteBtn.style.fontWeight = "500";
deleteBtn.style.transition = "all 0.15s ease";

deleteBtn.onmouseenter = () => {
  deleteBtn.style.background = "#ffe4f1";
};

deleteBtn.onmouseleave = () => {
  deleteBtn.style.background = "transparent";
};

deleteBtn.onclick = () => {
  menu.style.display = "none";
  openDeleteModal(msg, wrapper);
};

menu.appendChild(deleteBtn);

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

function openDeleteModal(msg, wrapper) {
  // remove old modal if exists
  const old = document.getElementById("deleteModal");
  if (old) old.remove();

  const modal = document.createElement("div");
  modal.id = "deleteModal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.background = "rgba(0,0,0,0.3)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = "99999";

  const box = document.createElement("div");
box.style.background = "#fff0f6"; // 🌸 theme pink
box.style.padding = "18px 0";
box.style.borderRadius = "16px";
box.style.minWidth = "240px";
box.style.fontSize = "14px";
box.style.boxShadow = "0 20px 40px rgba(236, 72, 153, 0.25)";
box.style.border = "1px solid #fbcfe8";
box.style.backdropFilter = "blur(8px)";
box.style.overflow = "hidden";

// =========================
// 🌸 HEADER ROW
// =========================
const header = document.createElement("div");
header.style.display = "flex";
header.style.alignItems = "center";
header.style.justifyContent = "space-between";
header.style.padding = "12px 18px 8px";

const title = document.createElement("div");
title.innerText = "Delete message?";
title.style.fontWeight = "600";
title.style.color = "#9d174d";
title.style.fontSize = "13px";

header.appendChild(title);

// ❌ CANCEL (top-right)
// 🌸 CANCEL (top-right text)
const cancelTop = document.createElement("button");
cancelTop.innerText = "Cancel";
cancelTop.style.border = "none";
cancelTop.style.background = "transparent";
cancelTop.style.cursor = "pointer";
cancelTop.style.fontSize = "13px";
cancelTop.style.fontWeight = "500";
cancelTop.style.color = "#be185d";
cancelTop.style.borderRadius = "6px";
cancelTop.style.padding = "4px 8px";
cancelTop.style.transition = "all 0.15s ease";

// hover effect
cancelTop.onmouseenter = () => {
  cancelTop.style.background = "#ffe4f1";
};

cancelTop.onmouseleave = () => {
  cancelTop.style.background = "transparent";
};

cancelTop.onclick = () => modal.remove();

header.appendChild(cancelTop);
box.appendChild(header);



const divider = document.createElement("div");
divider.style.height = "1px";
divider.style.background = "#fbcfe8";
divider.style.margin = "4px 0 6px";

box.appendChild(divider);


function styleModalItem(el, isDanger = false) {
  el.style.padding = "12px 18px";
  el.style.cursor = "pointer";
  el.style.fontWeight = "500";
  el.style.transition = "all 0.15s ease";
  el.style.color = isDanger ? "#e11d48" : "#9d174d";

  el.onmouseenter = () => {
    el.style.background = "#ffe4f1";
  };

  el.onmouseleave = () => {
    el.style.background = "transparent";
  };
}

  // Delete for me
  const delMe = document.createElement("div");
  delMe.innerText = "Delete for me";
styleModalItem(delMe, false);

  delMe.onclick = () => {
    wrapper.remove();
    modal.remove();
  };

  box.appendChild(delMe);

  // Delete for everyone (ONLY sender)
  if (msg.sender === username) {
    const delAll = document.createElement("div");
    delAll.innerText = "Delete for everyone";
   styleModalItem(delAll, true);

    delAll.onclick = () => {
      socket.emit("delete-message", {
        messageId: msg._id,
        username
      });
      modal.remove();
    };

    box.appendChild(delAll);
  }


  modal.appendChild(box);
  document.body.appendChild(modal);
}


