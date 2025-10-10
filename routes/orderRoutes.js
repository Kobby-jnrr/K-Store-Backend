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

/* ===================== GET VENDOR ORDERS ===================== */
router.get("/vendor-orders", verifyToken, async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Find all orders that include items for this vendor
    const orders = await Order.find({ "items.vendor": vendorId })
      .populate("user", "username email")
      .populate("items.product", "title price")
      .populate("items.vendor", "username");

    // Filter items to only include those for this vendor
    const vendorOrders = orders.map((order) => {
      const vendorItems = order.items.filter(
        (item) => item.vendor._id.toString() === vendorId.toString()
      );

      return {
        _id: order._id,
        user: order.user,
        items: vendorItems,
        total: vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
        status: order.status,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt,
      };
    });

    res.json(vendorOrders);
  } catch (err) {
    console.error("Failed to fetch vendor orders:", err);
    res.status(500).json({ error: "Failed to fetch vendor orders" });
  }
});


export default router;
