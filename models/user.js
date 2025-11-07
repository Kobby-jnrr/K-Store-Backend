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
      default: null,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    school: {
      type: String,
      required: function () {
        return this.role === "customer" || this.role === "vendor";
      },
      trim: true,
      lowercase: true,
    },
    refreshToken: {
      type: String,
    },
    resetAllowed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
