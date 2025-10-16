import express from "express";
import Notification from "../models/notification.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ---------------- GET all notifications for a user ---------------- */
router.get("/", verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const notifications = await Notification.find({
      $or: [{ target: role }, { target: "both" }],
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

/* ---------------- GET only unread notifications ---------------- */
router.get("/unread", verifyToken, async (req, res) => {
  try {
    const role = req.user.role;
    const notifications = await Notification.find({
      $or: [{ target: role }, { target: "both" }],
      readBy: { $ne: req.user._id },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ message: "Server error fetching notifications" });
  }
});

/* ---------------- Mark notification as read ---------------- */
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    if (!notification.readBy.includes(req.user._id)) {
      notification.readBy.push(req.user._id);
      await notification.save();
    }

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- ADMIN: Send notification ---------------- */
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { message, target } = req.body;
    if (!message || !target)
      return res.status(400).json({ message: "Message and target are required" });

    const notification = await Notification.create({ message, target });

    // Emit to all clients
    req.io.emit("new-notification", notification);

    res.status(201).json({ message: "Notification sent", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error creating notification" });
  }
});

/* ---------------- ADMIN: Delete notification ---------------- */
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Notification not found" });

    req.io.emit("delete-notification", { id: req.params.id });

    res.json({ message: "Notification deleted", deleted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error deleting notification" });
  }
});

export default router;
