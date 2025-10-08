import express from "express";
import Order from "../models/order.js";
import Cart from "../models/cart.js";
import Product from "../models/product.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId } = req.body;
  const cartItems = await Cart.find({ userId });
  if (cartItems.length === 0) return res.status(400).json({ msg: "Cart empty" });

  let total = 0;
  for (const item of cartItems) {
    const product = await Product.findById(item.productId);
    total += product.price * item.quantity;
  }

  const order = await Order.create({ userId, totalAmount: total });
  await Cart.deleteMany({ userId });
  res.json({ msg: "Order placed", order });
});

export default router;
