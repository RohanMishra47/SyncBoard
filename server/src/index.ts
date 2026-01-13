import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import prisma from "./lib/prisma.js";
import authRouter from "./routes/auth.js";

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

// Socket.io connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env["PORT"] || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
