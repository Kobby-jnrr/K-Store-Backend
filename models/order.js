import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: [
            "pending",
            "accepted",
            "rejected",
            "preparing",
            "ready",
            "delivered",
          ],
          default: "pending",
        },
      },
    ],

    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "momo"], required: true },
    momoNumber: { type: String },

    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery"],
      required: true,
      default: "pickup",
    },

    phone: { type: String },
    location: { type: String },

    status: {
      type: String,
      enum: ["pending", "confirmed", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
