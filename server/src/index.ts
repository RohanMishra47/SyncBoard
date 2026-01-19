import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import prisma from "./lib/prisma.js";
import authRouter from "./routes/auth.js";
import roomRoutes from "./routes/rooms.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env["CLIENT_URL"] || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/rooms", roomRoutes);

// Health check route
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Test database connection
app.get("/api/test-db", async (_req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({
      success: true,
      message: "Database connected!",
      userCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Database connection failed",
    });
  }
});

// Track connected users per room
interface ConnectedUser {
  id: string;
  name: string;
  socketId: string;
}

// In-memory storage for rooms and their users
const rooms = new Map<string, ConnectedUser[]>();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a room
  socket.on("join:room", ({ roomId, user }) => {
    socket.join(roomId);

    // Add user to room's user list
    const roomUsers = rooms.get(roomId) || [];
    const newUser: ConnectedUser = {
      id: user.id,
      name: user.name,
      socketId: socket.id,
    };

    // Remove any existing connection from this user (reconnection case)
    const filteredUsers = roomUsers.filter((u) => u.id !== user.id);
    filteredUsers.push(newUser);
    rooms.set(roomId, filteredUsers);

    console.log(`User ${user.name} joined room ${roomId}`);

    // Notify others in the room
    socket.to(roomId).emit("user:joined", newUser);

    // Send current user list to the newcomer
    socket.emit("room:users", filteredUsers);

    // Also broadcast updated user list to everyone
    io.to(roomId).emit("room:users", filteredUsers);
  });

  // Handle drawing events
  socket.on("draw:action", ({ roomId, action }) => {
    // Broadcast to everyone in the room EXCEPT the sender
    socket.to(roomId).emit("draw:action", action);
  });

  // Handle undo events
  socket.on("draw:undo", ({ roomId, action }) => {
    // Broadcast undo to other users in the room
    socket.to(roomId).emit("draw:undo", action);
  });

  // Handle cursor movement
  socket.on("cursor:move", ({ roomId, position, userId }) => {
    socket.to(roomId).emit("cursor:move", { position, userId });
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove user from all rooms
    rooms.forEach((users, roomId) => {
      const updatedUsers = users.filter((u) => u.socketId !== socket.id);

      if (updatedUsers.length !== users.length) {
        // User was in this room
        rooms.set(roomId, updatedUsers);

        // Notify remaining users
        io.to(roomId).emit("room:users", updatedUsers);

        const disconnectedUser = users.find((u) => u.socketId === socket.id);
        if (disconnectedUser) {
          io.to(roomId).emit("user:left", disconnectedUser);
        }
      }
    });
  });
});

const PORT = process.env["PORT"] || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.io ready for connections`);
});
