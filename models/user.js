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
    phone: {
      type: String,
      default: "", 
    },
    location: {
      type: String,
      default: "",
    },
    businessName: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: "", 
    },
    verified: {
      type: Boolean,
      default: false, // for admin verification of vendors
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
