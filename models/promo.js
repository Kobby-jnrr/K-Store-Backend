import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date }, // calculated automatically
  durationWeeks: { type: Number, enum: [1, 2, 3, 4], default: 2 },
  active: { type: Boolean, default: true }
});

// Pre-save hook to calculate endDate
promoSchema.pre("save", function (next) {
  if (this.durationWeeks) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationWeeks * 7);
    this.endDate = end;
  }
  next();
});

export default mongoose.model("Promo", promoSchema);
