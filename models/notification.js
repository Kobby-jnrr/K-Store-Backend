import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    recipientType: { type: String, enum: ["customer", "vendor", "both"], default: "both" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // for specific user
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // track users who read
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
