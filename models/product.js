import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      enum: [
        "electronics",
        "fashion",
        "home",
        "grocery",
        "baby",
        "beauty",
        "sports",
        "gaming"
      ], // optional: you can add more
    },
    image: { type: String, required: true },
    description: { type: String, trim: true },

    // ✅ NEW FIELD — track if product is active/sold/pending
    status: {
      type: String,
      enum: ["active", "sold", "pending", "hidden"],
      default: "active",
    },

    // ✅ Vendor reference
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Optional: automatically lowercase category before saving
productSchema.pre("save", function (next) {
  if (this.category) this.category = this.category.toLowerCase();
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
