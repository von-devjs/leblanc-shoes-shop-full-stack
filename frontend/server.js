// server.js
import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";

// Use .env in production
const BROADCAST_KEY = "supersecret123";

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));

// Create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // restrict to frontend origin in production
  },
});

/* ---------------------- SOCKET.IO SETUP ---------------------- */
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Client tells us their role and/or user_id
  socket.on("join", ({ role, user_id }) => {
    if (role === "admin") {
      socket.join("admins");
      console.log(`👑 Admin joined: ${socket.id}`);
    }
    if (role === "user" && user_id) {
      socket.join(`user_${user_id}`);
      console.log(`🙋 User ${user_id} joined: ${socket.id}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

/* ---------------------- API MIDDLEWARE ---------------------- */
function validateApiKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== BROADCAST_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

/* ---------------------- BROADCAST ENDPOINT ---------------------- */
app.post("/broadcastOrder", validateApiKey, (req, res) => {
  const payload = req.body;

  if (!payload || !payload.id) {
    return res.status(400).json({ success: false, message: "Invalid payload" });
  }

  if (payload.removed) {
    // Notify the user and admins
    if (payload.user_id) {
      io.to(`user_${payload.user_id}`).emit("order_removed", {
        id: payload.id,
        user_id: payload.user_id,
      });
    }
    io.to("admins").emit("order_removed", payload);
    console.log(`📢 Broadcast order_removed: ${payload.id}`);
  } else {
    // Notify the user and admins
    if (payload.user_id) {
      io.to(`user_${payload.user_id}`).emit("order_updated", payload);
    }
    io.to("admins").emit("order_updated", payload);
    console.log(`📢 Broadcast order_updated: ${payload.id}`);
  }

  return res.json({ success: true });
});

/* ---------------------- HEALTH CHECK ---------------------- */
app.get("/", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/* ---------------------- START SERVER ---------------------- */
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
