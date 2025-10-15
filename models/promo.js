import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
  vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  startDate: { type: Date, default: Date.now },
  durationWeeks: { type: Number, enum: [1, 2, 3, 4], default: 2 },
  endDate: { type: Date },
  active: { type: Boolean, default: true },
});

// Pre-save: calculate endDate
promoSchema.pre("save", function(next) {
  if (this.durationWeeks) {
    const end = new Date(this.startDate);
    end.setDate(end.getDate() + this.durationWeeks * 7);
    this.endDate = end;
  }
  next();
});

// Virtual: isActive
promoSchema.virtual("isActive").get(function() {
  return this.active && new Date() <= this.endDate;
});

export default mongoose.model("Promo", promoSchema);
