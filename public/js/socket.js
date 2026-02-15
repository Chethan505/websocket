const socket = io();

const role = localStorage.getItem("role");
const isAdmin = role === "admin" || role === "moderator";

const token = localStorage.getItem("token");
const username = localStorage.getItem("username");

if (!token || !username) {
  window.location.href = "/login.html";
}

let currentRoom = "global";

socket.emit("join", {
  username: username,
  role: role
});


socket.emit("join-room", currentRoom);

const messages = document.getElementById("messages");
const roomTitle = document.getElementById("roomTitle");
const roomList = document.getElementById("roomList");
const userList = document.getElementById("userList");
const fileInput = document.getElementById("fileInput");
const filePreview = document.getElementById("filePreview");
const emojiBtn = document.getElementById("emojiBtn");
const emojiPicker = document.getElementById("emojiPicker");
const msgInput = document.getElementById("msg");


msgInput.addEventListener("keydown", function (e) {

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();  // stop new line
    send();              // send message
  }

});

msgInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});



let selectedFile = null;
filePreview.innerText = "";

/* ===========================
   ROOM FUNCTIONS
=========================== */

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


/* ===========================
   SEND FUNCTION (FIXED)
=========================== */

async function send() {

  const textInput = document.getElementById("msg");
  const text = textInput.value.trim();

  // ===== FILE CASE =====
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

  // ===== TEXT CASE =====
  if (text) {
    socket.emit("room-message", {
      room: currentRoom,
      sender: username,
      message: text
    });

    textInput.value = "";
    textInput.style.height = "auto";
  }
}


/* ===========================
   FILE SELECTION
=========================== */

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  selectedFile = file;
  filePreview.innerText = `Selected: ${file.name}`;
});

// Toggle emoji picker
emojiBtn.addEventListener("click", () => {
  emojiPicker.classList.toggle("hidden");
});

// Insert emoji into input
emojiPicker.addEventListener("click", (e) => {

  if (e.target.classList.contains("emoji")) {
    msgInput.value += e.target.textContent;
    msgInput.focus();
  }

});


// Close picker when clicking outside
document.addEventListener("click", (e) => {
  if (!emojiBtn.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.add("hidden");
  }
});


/* ===========================
   SOCKET LISTENERS
=========================== */

socket.on("room-history", (msgs) => {
  msgs.forEach(renderMessage);
});

socket.on("file-message", (msg) => {
  renderMessage(msg);
});

socket.on("room-message", (msg) => {
  renderMessage(msg);
});

socket.on("room-deleted", (roomName) => {

  alert("Room deleted");

  location.reload();
});


/* ===========================
   RENDER MESSAGE
=========================== */

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

  // ===== Message Content =====
const displayName = isMe ? "You" : msg.sender;

let content = `<b>${displayName}</b><br>`;


  if (msg.type === "image") {
    content += `<img src="${msg.fileUrl}" class="rounded mt-1 max-h-40">`;
  }
  else if (msg.type === "audio") {
    content += `<audio controls src="${msg.fileUrl}" class="mt-1"></audio>`;
  }
  else if (msg.type === "file") {
    content += `
      <a href="${msg.fileUrl}" download class="underline">
        ${msg.fileName}
      </a>
    `;
  }
  else {
    content += msg.message;
  }

  bubble.innerHTML = content;

  // ===== DELETE BUTTON =====
  if (isAdmin || msg.sender === username) {

    const delBtn = document.createElement("button");

   delBtn.className = `
  absolute top-1 right-1
  text-gray-300 hover:text-red-500
  text-xs transition opacity-0 group-hover:opacity-100
`;


    delBtn.innerHTML = "✕";

    delBtn.onclick = () => {
      socket.emit("delete-message", {
        messageId: msg._id,
        username: username
      });
    };

    bubble.appendChild(delBtn);
  }

  wrapper.appendChild(bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
}


/* ===========================
   ONLINE USERS
=========================== */

socket.on("online-users", (users) => {

  userList.innerHTML = "";

  users.forEach(user => {

    // ❌ Skip yourself
    if (user.username === username) return;

    const li = document.createElement("li");
    li.className = "flex justify-between items-center p-2 hover:bg-pink-50 rounded-lg transition";

    // ===== LEFT SIDE (Avatar + Name) =====
    const left = document.createElement("div");
    left.className = "flex items-center gap-3";

    const firstLetter = user.username.charAt(0).toUpperCase();

    const avatar = document.createElement("div");
    avatar.className =
      "w-9 h-9 flex items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 text-white font-semibold";
    avatar.innerText = firstLetter;

    const name = document.createElement("span");
    name.className = "text-sm font-medium text-gray-700";
    name.innerText = user.username;

    left.appendChild(avatar);
    left.appendChild(name);

    li.appendChild(left);

    // ===== RIGHT SIDE (Buttons) =====
    const actions = document.createElement("div");
    actions.className = "flex gap-2 items-center";

    // 💬 Private Chat Request Button
    const requestBtn = document.createElement("button");
    requestBtn.innerText = "💬";
    requestBtn.className = "text-xs text-blue-500 hover:text-blue-700";

   requestBtn.onclick = () => {

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


    actions.appendChild(requestBtn);

    // 🛑 Admin Kick Button
    if (isAdmin) {
      const kickBtn = document.createElement("button");
      kickBtn.innerText = "Kick";
      kickBtn.className = "text-xs text-red-500 hover:text-red-700";

      kickBtn.onclick = () => {
        socket.emit("kick-user", { targetSocketId: user.socketId });
      };

      actions.appendChild(kickBtn);
    }

    li.appendChild(actions);

    userList.appendChild(li);
  });
});


/* ===========================
   ADMIN EVENTS
=========================== */

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

/* ===========================
   LOGOUT
=========================== */

function logout() {
  localStorage.clear();
  window.location.href = "/login.html";
}

socket.on("private-chat-request", ({ fromUsername, fromSocketId }) => {

  const accept = confirm(`${fromUsername} wants to start a private chat. Accept?`);

  if (accept) {

    const roomName = `private-${username}-${Date.now()}`;

    socket.emit("private-chat-accept", {
      fromSocketId,
      roomName
    });

    addRoom(roomName, "private");
    switchRoom(roomName);
  }

});

socket.on("private-room-created", (roomName) => {
  addRoom(roomName, "private");
  switchRoom(roomName);
});

function deleteRoom() {

  if (currentRoom === "global") {
    alert("Cannot delete global room");
    return;
  }

  const confirmDelete = confirm("Delete this room?");
  if (!confirmDelete) return;

  socket.emit("delete-room", currentRoom);
}


socket.on("room-invite", ({ roomName, fromUsername, fromSocketId }) => {

  const accept = confirm(`${fromUsername} invited you to join "${roomName}". Accept?`);

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




socket.on("room-joined", (roomName) => {

  addRoom(roomName, "group");
  switchRoom(roomName);

});

socket.on("invite-sent", ({ roomName }) => {
  alert(`Invite sent for room "${roomName}". Waiting for response...`);
});


socket.on("invite-accepted", ({ roomName }) => {
  alert(`User accepted your invite to "${roomName}"`);
});



socket.on("invite-ignored", ({ roomName }) => {
  alert(`User ignored your invite to "${roomName}"`);
});



