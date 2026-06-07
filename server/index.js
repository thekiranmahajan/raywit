console.log("Server is running...");

import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { Server } from "socket.io";
import { nanoid } from "nanoid";
import { configureCors, socketCorsConfig } from "./cors-config.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import dotenv from "dotenv";
import { getMessagesByRoom, saveMessage } from "./utils/db.js";
import { connectMongoose } from "./utils/mongoose.js";
import AuthSession from "./models/AuthSession.js";
// Load environment variables
dotenv.config();

// Use SERVER_URL from environment, fallback to localhost if not set
export const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  ...socketCorsConfig,
  maxHttpBufferSize: 5e6,
  pingTimeout: 30000,
  connectTimeout: 10000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
});

// Session TTL (milliseconds). Can be overridden with .env SESSION_TTL_MS
const SESSION_TTL_MS = parseInt(
  process.env.SESSION_TTL_MS || String(24 * 60 * 60 * 1000),
  10,
); // default 24h

// Validate socket auth token on connection handshake
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      const err = new Error("Authentication error: missing token");
      err.data = { code: "NO_TOKEN" };
      return next(err);
    }

    await connectMongoose();
    const session = await AuthSession.findOne({
      token,
      expiresAt: { $gt: new Date() },
    })
      .lean()
      .exec();

    if (!session) {
      const err = new Error("Authentication error: invalid or expired token");
      err.data = { code: "INVALID_TOKEN" };
      return next(err);
    }

    socket.data = socket.data || {};
    socket.data.userName = session.userName;
    socket.data.userId = session.userId;
    socket.data.authToken = token;

    return next();
  } catch (e) {
    return next(e);
  }
});

// Express Middleware
configureCors(app);
app.use(express.json({ limit: "5mb" }));
app.use(rateLimiter);

const PORT = process.env.PORT || 5000;

// Health Check
app.get("/", (req, res) => {
  res.send("RayWit backend is running!");
});

// In-memory storage
const chatRooms = {};
const typingUsers = {};

// API Routes
import apiRouter from "./routes/api.js";
import imageRouter from "./routes/images.js";

const apiRoutes = apiRouter(chatRooms, io);
app.use("/api", apiRoutes);
app.use("/api/images", imageRouter);

// Create necessary directories
const UPLOADS_BASE_DIR = path.join(process.cwd(), "uploads");
const SESSION_IMAGES_DIR = path.join(UPLOADS_BASE_DIR, "sessions");

if (!fs.existsSync(UPLOADS_BASE_DIR)) {
  fs.mkdirSync(UPLOADS_BASE_DIR, { recursive: true });
}
if (!fs.existsSync(SESSION_IMAGES_DIR)) {
  fs.mkdirSync(SESSION_IMAGES_DIR, { recursive: true });
}

// Serve uploaded images statically
app.use("/images", express.static(UPLOADS_BASE_DIR));

// Import image cleanup utilities
import {
  cleanupSessionImages,
  cleanupInactiveSessions,
} from "./utils/imageUtils/index.js";

// Run a periodic cleanup job every 24 hours with configurable age (24 hours)
setInterval(() => cleanupInactiveSessions(24), 24 * 60 * 60 * 1000);

// Room/typing init
const initializeChatRoom = (roomId) => {
  if (!chatRooms[roomId]) {
    chatRooms[roomId] = {
      users: new Map(),
      messages: [],
    };
  }
  if (!typingUsers[roomId]) {
    typingUsers[roomId] = new Set();
  }
};

const clearPendingUserLeave = (roomId, userId) => {
  const room = chatRooms[roomId];
  if (!room) return;
  const user = room.users.get(userId);
  if (user?.leaveTimer) {
    clearTimeout(user.leaveTimer);
    user.leaveTimer = null;
  }
};

const emitUserLeft = (roomId, userName) => {
  const room = chatRooms[roomId];
  if (!room) return;
  const usersArr = Array.from(room.users.values()).map((entry) => entry.name);
  io.to(roomId).emit("user-left", {
    userId: userName,
    users: usersArr,
  });
  io.to(roomId).emit("users-typing", {
    userIds: Array.from(typingUsers[roomId] || []),
  });
};

const scheduleUserLeave = (roomId, userId) => {
  const room = chatRooms[roomId];
  const user = room?.users.get(userId);
  if (!room || !user || user.sockets.size > 0 || user.leaveTimer) return;

  user.leaveTimer = setTimeout(() => {
    if (user.sockets.size > 0) {
      user.leaveTimer = null;
      return;
    }

    const userName = user.name;
    room.users.delete(userId);
    emitUserLeft(roomId, userName);
  }, 200);
};

const normalizeDbMessage = (message) => ({
  encryptedData: message.encryptedData,
  userId: message.userId,
  userName: message.userName,
  messageId: message.messageId,
  replyTo: message.replyToMessageId
    ? {
        message: message.replyToEncryptedData,
        sender: message.replyToSender,
        messageId: message.replyToMessageId,
      }
    : undefined,
  timestamp: message.timestamp,
});

// Socket.IO Handling
io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  let currentRoomId = null;
  let currentUserId = null;

  socket.on("join-room", async ({ roomId, userName = "User" }) => {
    console.log(`${userName} ${socket.id} joined room ${roomId}`);

    initializeChatRoom(roomId);

    const persistedMessages = (await getMessagesByRoom(roomId)).map(
      normalizeDbMessage,
    );

    if (chatRooms[roomId].messages.length === 0) {
      chatRooms[roomId].messages = persistedMessages;
    }

    const sessionUserId =
      socket.data.userId || `${socket.data.userName || userName}_${nanoid(4)}`;
    const sessionUserName = socket.data.userName || userName;
    socket.join(roomId);

    const roomUsers = chatRooms[roomId].users;
    const isNewUser = !roomUsers.has(sessionUserId);
    const existingUser = roomUsers.get(sessionUserId);

    if (existingUser) {
      clearPendingUserLeave(roomId, sessionUserId);
      existingUser.sockets.add(socket.id);
    } else {
      roomUsers.set(sessionUserId, {
        name: sessionUserName,
        sockets: new Set([socket.id]),
        leaveTimer: null,
      });
    }

    currentRoomId = roomId;
    currentUserId = sessionUserId;

    const usersArr = Array.from(roomUsers.values()).map((u) => u.name);
    socket.emit("joined-room", { userId: sessionUserId, users: usersArr });

    socket.emit("load-old-messages", {
      messages: chatRooms[roomId].messages,
    });

    if (isNewUser) {
      socket.to(roomId).emit("user-joined", {
        userId: sessionUserName,
        users: usersArr,
      });
    }

    // Handle message sending
    socket.on(
      "send-message",
      async ({ encryptedData, userId, messageId, replyTo }) => {
        console.log(
          `Message from ${userId} in room ${roomId}:`,
          encryptedData,
          replyTo ? "Reply to: " + replyTo.messageId : "",
        );

        const senderName = socket.data.userName || userName;
        const storedMessage = {
          roomId,
          userId,
          userName: senderName,
          messageId,
          encryptedData,
          replyToMessageId: replyTo?.messageId,
          replyToSender: replyTo?.sender,
          replyToEncryptedData: replyTo?.message,
          timestamp: Date.now(),
        };

        chatRooms[roomId].messages.push({
          encryptedData,
          userId,
          userName: senderName,
          messageId,
          replyTo,
          timestamp: storedMessage.timestamp,
        });

        // Send acknowledgment to sender immediately
        socket.emit("message-ack", {
          messageId,
          deliveryStatus: "sent",
          timestamp: storedMessage.timestamp,
        });

        // Broadcast to other users
        socket.to(roomId).emit("receive-message", {
          encryptedData,
          userId,
          userName: senderName,
          messageId,
          replyTo,
          timestamp: storedMessage.timestamp,
        });

        // Send delivery confirmation to all users in room (for double tick)
        io.to(roomId).emit("message-delivered", {
          messageId,
          deliveryStatus: "delivered",
        });

        saveMessage(storedMessage).catch((error) => {
          console.error("Failed to persist chat message:", error);
        });
      },
    );

    // Typing indicator
    socket.on("user-typing", ({ isTyping }) => {
      const typingName = socket.data.userName;
      if (!typingName) return;
      if (!typingUsers[roomId]) typingUsers[roomId] = new Set();
      if (isTyping) {
        typingUsers[roomId].add(typingName);
      } else {
        typingUsers[roomId].delete(typingName);
      }
      io.to(roomId).emit("users-typing", {
        userIds: Array.from(typingUsers[roomId]),
      });
      console.log(`Typing in ${roomId}:`, Array.from(typingUsers[roomId]));
    });

    // Leaving manually
    socket.on("leave-room", () => {
      socket.leave(roomId);
      const roomUsers = chatRooms[roomId]?.users;
      const userEntry = roomUsers?.get(currentUserId);
      if (userEntry) {
        userEntry.sockets.delete(socket.id);
        // If this was the last socket for the user, remove immediately and notify others
        if (userEntry.sockets.size === 0) {
          const userName = userEntry.name;
          roomUsers.delete(currentUserId);
          emitUserLeft(roomId, userName);
        }
      }
      typingUsers[roomId]?.delete(socket.data.userName);
    });

    // Disconnection
    socket.on("disconnect", () => {
      if (currentRoomId && currentUserId) {
        const roomUsers = chatRooms[currentRoomId]?.users;
        const userEntry = roomUsers?.get(currentUserId);
        if (userEntry) {
          userEntry.sockets.delete(socket.id);
          // Immediately remove and notify if this was the last socket
          if (userEntry.sockets.size === 0) {
            const userName = userEntry.name;
            roomUsers.delete(currentUserId);
            emitUserLeft(currentRoomId, userName);
          }
        }
        typingUsers[currentRoomId]?.delete(socket.data.userName);
        console.log(`Disconnected from room ${currentRoomId}`);
      }
    });
  });
});

// Start server after mongoose connection
connectMongoose()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
