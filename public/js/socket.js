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
  li.innerText = room;
  li.onclick = () => switchRoom(room);
  roomList.appendChild(li);
}

/* ===========================
   SEND FUNCTION (FIXED)
=========================== */

async function send() {

  const textInput = document.getElementById("msg");
  const text = textInput.value.trim();  // ✅ trimmed

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

    // ✅ Reset everything properly
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
  let content = `<b>${msg.sender}</b><br>`;

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

    const li = document.createElement("li");
    li.className = "flex justify-between items-center p-2 hover:bg-pink-50 rounded-lg transition";

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
