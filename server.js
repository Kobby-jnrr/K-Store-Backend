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
import promoRoutes from "./routes/promoRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import Notification from "./models/notification.js";

dotenv.config();
connectDB();

const app = express();
const server = createServer(app);

// ✅ Allow local + deployed frontend
const allowedOrigins = [
  "http://localhost:5173",
  "https://k-store-frontend.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// ✅ Create Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ Attach io to every request
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/promo", promoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Socket connection events
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);
    // userId and role will be sent from frontend when connecting
    const { userId, role } = socket.handshake.query;
    if (role === "vendor") socket.join("vendors");
    else if (role === "customer") socket.join("customers");

  // optional: personal room
  socket.join(userId);


  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// ✅ Auto-delete expired notifications every 30s
setInterval(async () => {
  const now = new Date();
  const expired = await Notification.find({ expiresAt: { $lte: now } });
  if (expired.length > 0) {
    for (const n of expired) {
      io.emit("delete-notification", n._id);
      await Notification.deleteOne({ _id: n._id });
    }
    console.log(`🧹 Deleted ${expired.length} expired notifications`);
  }
}, 30000);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
