import prisma from "@/lib/prisma.js";
import { Router } from "express";

export const router: Router = Router();

router.post("/join", async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Create user with simple name (portfolio approach)
    const user = await prisma.user.create({
      data: { name: name.trim() },
    });

    return res.json({ user });
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
