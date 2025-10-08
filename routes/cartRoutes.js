import express from "express";
import Cart from "../models/cart.js";

const router = express.Router();

// Get cart
router.get("/:userId", async (req, res) => {
  const items = await Cart.find({ userId: req.params.userId });
  res.json(items);
});

// Add to cart
router.post("/", async (req, res) => {
  const { userId, productId, quantity } = req.body;
  const existing = await Cart.findOne({ userId, productId });
  if (existing) {
    existing.quantity += quantity;
    await existing.save();
  } else {
    await Cart.create({ userId, productId, quantity });
  }
  res.json({ message: "Added to cart" });
});

export default router;
