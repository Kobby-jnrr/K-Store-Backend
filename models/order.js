import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        vendor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        status:{type: String, enum: ["pending", "accepted", "rejected", "preparing", "ready", "delivered"], default: "pending"},
        passedToVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }]
      },
    ],
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "card", "momo"], required: true },
    momoNumber: String,
    cardDetails: {
      cardNumber: String,
      expiry: String,
      cvv: String,
    },
    status: { type: String, enum: ["pending", "confirmed", "delivered"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
