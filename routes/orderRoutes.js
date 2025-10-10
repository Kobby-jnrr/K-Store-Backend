import express from "express";
import Order from "../models/order.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

/* ===================== CREATE ORDER ===================== */
router.post("/", verifyToken, async (req, res) => {
  try {
    const { items, total, paymentMethod, momoNumber, cardDetails } = req.body;

    const order = new Order({
      user: req.user.id,
      items,
      total,
      paymentMethod,
      momoNumber,
      cardDetails,
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

/* ===================== GET USER ORDERS ===================== */
router.get("/my-orders", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate("items.product", "title price image")
      .populate("items.vendor", "username")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

export default router;
