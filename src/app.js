const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const chatRoutes = require("./routes/chat.routes");
const uploadRoutes = require("./routes/upload.routes");

const app = express();
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);


app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));


app.use(express.static(path.join(__dirname, "..", "public")));

module.exports = app;
