import express from "express";
import Notification from "../models/notification.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------- ADMIN: Create new notification ---------------- */
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { message, target } = req.body;
    if (!message || !target)
      return res.status(400).json({ message: "Message and target are required" });

    const notification = await Notification.create({ message, target });

    console.log("📡 Emitting new-notification:", notification.message);
    req.io.emit("new-notification", notification);

    res.status(201).json({ message: "Notification sent", notification });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({ message: "Server error creating notification" });
  }
});

/* ---------------- ADMIN: Delete notification ---------------- */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Notification not found" });

    console.log("🗑️ Emitting delete-notification:", deleted._id);
    req.io.emit("delete-notification", deleted._id);

    res.json({ message: "Notification deleted" });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Server error deleting notification" });
  }
});

/* ---------------- GET all notifications ---------------- */
router.get("/", verifyToken, async (req, res) => {
  try {
    const role = req.user.role || "customer";
    const notifications = await Notification.find({
      $or: [{ target: role }, { target: "both" }],
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

export default router;
