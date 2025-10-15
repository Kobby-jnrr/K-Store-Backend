import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }, // set by admin
  active: { type: Boolean, default: true }
});

export default mongoose.model("Promo", promoSchema);
