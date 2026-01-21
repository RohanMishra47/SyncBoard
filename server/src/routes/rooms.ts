import prisma from "@/lib/prisma.js";
import router from "./auth.js";

// Create a new room
router.post("/create", async (req, res) => {
  try {
    const { name, userId } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: "Room name is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Generate URL-friendly slug from name
    const slug =
      name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-") +
      "-" +
      Date.now().toString(36); // Add timestamp for uniqueness

    const room = await prisma.room.create({
      data: {
        name: name.trim(),
        slug,
        createdById: userId,
        canvasData: { actions: [] }, // Initialize with empty canvas
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.json({ room });
  } catch (error) {
    console.error("Room creation error:", error);
    return res.status(500).json({ error: "Failed to create room" });
  }
});

// Get room by slug
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const room = await prisma.room.findUnique({
      where: { slug },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    return res.json({ room });
  } catch (error) {
    console.error("Room fetch error:", error);
    return res.status(500).json({ error: "Failed to fetch room" });
  }
});

// Save canvas data to room
router.put("/:slug/canvas", async (req, res) => {
  try {
    const { slug } = req.params;
    const { actions } = req.body;

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: "Invalid canvas data" });
    }

    // Limit stored actions to prevent database bloat
    const MAX_STORED_ACTIONS = 1000;
    const actionsToStore = actions.slice(-MAX_STORED_ACTIONS);

    const room = await prisma.room.update({
      where: { slug },
      data: {
        canvasData: { actions: actionsToStore },
        updatedAt: new Date(),
      },
    });

    return res.json({
      room,
      savedActions: actionsToStore.length,
      truncated: actions.length > MAX_STORED_ACTIONS,
    });
  } catch (error) {
    console.error("Canvas save error:", error);
    return res.status(500).json({ error: "Failed to save canvas" });
  }
});

// Get list of recent rooms
router.get("/", async (_req, res) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({ rooms });
  } catch (error) {
    console.error("Room list error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

export default router;
