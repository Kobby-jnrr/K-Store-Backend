import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: String,
  totalAmount: Number,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Order", orderSchema);
