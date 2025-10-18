import express from "express";
import Notification from "../models/notification.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ------------------ SEND NOTIFICATION (ADMIN) ------------------ */
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, message, recipientType, userId } = req.body;

    if (!title || !message)
      return res.status(400).json({ message: "Title and message are required" });

    const notification = new Notification({
      title,
      message,
      recipientType: recipientType || "both",
      userId: userId || null,
    });

    await notification.save();

    res.status(201).json({ message: "Notification sent successfully", notification });
  } catch (error) {
    console.error("Error sending notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

/* ------------------ DELETE ALL NOTIFICATIONS (ADMIN) ------------------ */
router.delete("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await Notification.deleteMany({});
    res.status(200).json({ message: "All notifications deleted successfully" });
  } catch (error) {
    console.error("Error deleting notifications:", error);
    res.status(500).json({ message: "Failed to delete notifications" });
  }
});

/* ------------------ GET NOTIFICATIONS ------------------ */
router.get("/", verifyToken, async (req, res) => {
  try {
    let notifications;

    if (req.user.role === "admin") {
      notifications = await Notification.find().sort({ createdAt: -1 });
    } else {
      notifications = await Notification.find({
        $or: [
          { recipientType: req.user.role },
          { recipientType: "both" },
          { userId: req.user._id },
        ],
      }).sort({ createdAt: -1 });
    }

    const unreadCount = notifications.filter(n => !n.readBy.includes(req.user._id)).length;

    // Optional: add a field for admin to see how many users read it
    const notificationsWithReadCount = notifications.map(n => ({
      ...n._doc,
      readCount: n.readBy.length,
    }));

    res.status(200).json({ notifications: notificationsWithReadCount, unreadCount });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});


/* ------------------ MARK ALL AS READ (USER) ------------------ */
router.put("/mark-read", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      {
        $or: [
          { recipientType: req.user.role },
          { recipientType: "both" },
          { userId },
        ],
        readBy: { $ne: userId }, // only update if user hasn't read it yet
      },
      { $push: { readBy: userId } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

export default router;
