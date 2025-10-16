import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true },
    target: { type: String, enum: ["vendor", "customer", "both"], default: "both" },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Tracks which users have read
  },
  { timestamps: true }
);

// TTL index automatically deletes expired notifications
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notification", notificationSchema);
