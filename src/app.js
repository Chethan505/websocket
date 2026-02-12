const express = require("express");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);


app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));


app.use(express.static(path.join(__dirname, "..", "public")));

module.exports = app;
