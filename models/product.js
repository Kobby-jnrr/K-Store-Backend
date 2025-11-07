import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    school: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    oldPrice: {
      type: Number,
      min: 0,
    },

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
        "gaming",
        "books",
        "toys",
        "automotive",
        "jewelry",
        "health",
        "pets",
        "office",
        "tools",
        "garden",
        "music",
        "movies",
        "appliances",
        "footwear",
        "accessories",
        "outdoor",
        "food",
        "other",
      ],
    },

    image: {
      type: String,
      required: true,
    },
    cloudinary_id: {
      type: String,
    }, // store Cloudinary public_id
    description: { type: String, trim: true },

    // Track product status
    status: {
      type: String,
      enum: ["active", "sold", "pending", "hidden"],
      default: "active",
    },

    // Vendor reference
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Automatically lowercase category before saving
productSchema.pre("save", function (next) {
  if (this.category) this.category = this.category.toLowerCase();
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
