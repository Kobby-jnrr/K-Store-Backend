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
/* ===================== UPDATE VENDOR ITEM STATUS ===================== */
// routes/orderRoutes.js
router.put("/vendor-orders/:orderId/item/:itemId", verifyToken, async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;
    const vendorId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.vendor.toString() !== vendorId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const validStatuses = ["pending", "accepted", "rejected", "preparing", "ready", "delivered"];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: "Invalid status" });

    item.status = status;

    // 🔹 Update overall order status based on vendor items
    const allStatuses = order.items.map(i => i.status);

    if (allStatuses.every(s => s === "delivered")) order.status = "delivered";
    else if (allStatuses.some(s => ["ready", "preparing", "accepted"].includes(s))) order.status = "confirmed";
    else order.status = "pending";

    await order.save();

    res.json({ message: "Item status updated", item, orderStatus: order.status });
  } catch (err) {
    console.error("Failed to update item status:", err);
    res.status(500).json({ error: "Failed to update item status", details: err.message });
  }
});

// POST /api/admin/orders/:orderId/pass
router.post("/orders/:orderId/pass", verifyToken, async (req, res) => {
  try {
    const { vendorId } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (!order.passedToVendors) order.passedToVendors = [];
    if (!order.passedToVendors.includes(vendorId)) {
      order.passedToVendors.push(vendorId);
    }

    await order.save();
    res.json({ message: "Order passed to vendor", order });
  } catch (err) {
    res.status(500).json({ error: "Failed to pass order" });
  }
});

export default router;
