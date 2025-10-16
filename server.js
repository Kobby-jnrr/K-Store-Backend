import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import testRoutes from "./routes/test.js";
import adminRoutes from "./routes/adminRoutes.js";
import promoRoutes from "./routes/promoRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import Notification from "./models/notification.js"; // 👈 import the model

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware to give routes access to Socket.IO instance
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

// Socket.IO events
io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// 🔹 Auto-emit expired notifications every 30s
setInterval(async () => {
  try {
    const now = new Date();
    const expiredNotifications = await Notification.find({ expiresAt: { $lte: now } });

    if (expiredNotifications.length > 0) {
      expiredNotifications.forEach((notif) => {
        io.emit("delete-notification", { id: notif._id });
      });
    }
  } catch (err) {
    console.error("❌ Error emitting expired notifications:", err);
  }
}, 30000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
