import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["customer", "vendor", "admin"],
      default: "customer",
    },
    // ✅ Add this field for admin verification of vendors
    verified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
