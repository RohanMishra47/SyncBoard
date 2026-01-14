import prisma from "@/lib/prisma.js";
import { Router } from "express";

export const router: Router = Router();

router.post("/join", async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    let user;

    // If userId provided, try to find existing user
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });

      // If found, optionally update their name
      if (user && user.name !== name.trim()) {
        user = await prisma.user.update({
          where: { id: userId },
          data: { name: name.trim() },
        });
      }
    }

    // If no user found (or no userId provided), create new one
    if (!user) {
      user = await prisma.user.create({
        data: { name: name.trim() },
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
