import express from "express";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { connectMongoose } from "../utils/mongoose.js";
import User from "../models/User.js";
import AuthSession from "../models/AuthSession.js";
const router = express.Router();

dotenv.config();

const getTokenFromRequest = (req) => {
  return (
    req.headers.authorization?.replace("Bearer ", "") || req.query.token || ""
  );
};

export default function (chatRooms, io) {
  router.post("/login", async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      await connectMongoose();
      const users = await User.find({ active: true }).lean().exec();
      let matchedUser = null;

      for (const user of users) {
        if (await bcrypt.compare(password.toString(), user.passwordHash)) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        return res.status(401).json({ error: "Invalid password" });
      }

      const token = nanoid(24);
      const ttl = parseInt(
        process.env.SESSION_TTL_MS || String(24 * 60 * 60 * 1000),
        10,
      );
      const expiresAt = new Date(Date.now() + ttl);

      await AuthSession.create({
        token,
        userId: String(matchedUser._id),
        userName: matchedUser.userName,
        expiresAt,
      });

      return res.json({ userName: matchedUser.userName, token });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ error: "Login failed" });
    }
  });

  router.get("/validate-token", async (req, res) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({ valid: false });
      }

      await connectMongoose();
      const session = await AuthSession.findOne({
        token,
        expiresAt: { $gt: new Date() },
      })
        .lean()
        .exec();

      if (!session) {
        return res.status(401).json({ valid: false });
      }

      return res.json({ valid: true, userName: session.userName });
    } catch (error) {
      console.error("Token validation error:", error);
      return res.status(500).json({ valid: false });
    }
  });

  // Health check endpoint
  router.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date(),
      rooms: Object.keys(chatRooms).length,
    });
  });

  router.get("/check-room/:roomId", (req, res) => {
    try {
      const { roomId } = req.params;
      const exists = roomId in chatRooms;

      res.json({ exists });
    } catch (error) {
      console.error("Error checking room:", error);
      res.status(500).json({ error: "Failed to check room status" });
    }
  });

  // Create a new room
  router.post("/create-room/:roomId", (req, res) => {
    try {
      const { roomId } = req.params;

      if (roomId in chatRooms) {
        return res.json({ success: true, created: false });
      }

      chatRooms[roomId] = {
        messages: [],
        users: new Set(),
      };

      res.json({ success: true, created: true });
    } catch (error) {
      console.error("Error creating room:", error);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Delete a room's messages and all stored images
  router.delete("/chat/:roomId", async (req, res) => {
    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await connectMongoose();
      const session = await AuthSession.findOne({
        token,
        expiresAt: { $gt: new Date() },
      })
        .lean()
        .exec();
      if (!session) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { cleanupSessionImages, getAllSessionDirectories } =
        await import("../utils/imageUtils/index.js");
      const { deleteMessagesByRoom } = await import("../utils/db.js");

      const { roomId } = req.params;

      // Delete messages from DB
      const deletedCount = await deleteMessagesByRoom(roomId);

      // Delete all session image directories (remove everything)
      const sessions = getAllSessionDirectories();
      for (const s of sessions) {
        try {
          await cleanupSessionImages(s);
        } catch (err) {
          console.warn(`Failed to cleanup images for session ${s}:`, err);
        }
      }

      // Clear in-memory messages if present
      if (chatRooms[roomId]) {
        chatRooms[roomId].messages = [];
      }

      if (io) {
        io.to(roomId).emit("chat-cleared", { roomId });
      }

      return res.json({ success: true, deletedCount });
    } catch (error) {
      console.error("Error deleting chat:", error);
      return res.status(500).json({ error: "Failed to delete chat" });
    }
  });

  return router;
}
