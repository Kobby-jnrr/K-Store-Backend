import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.js";
import Product from "../models/product.js";
import Promo from "../models/promo.js";
import Order from "../models/order.js";

// ---------------- CLOUDINARY CONFIG ----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: "30d" }
  );
  return { accessToken, refreshToken };
};

// ---------------- REGISTER ----------------
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role, phone, location, businessName } =
      req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "User already exists" });

    //Check if business name already exists (only if vendor and businessName provided)
    if (role === "vendor" && businessName) {
      const existingBusiness = await User.findOne({ businessName });
      if (existingBusiness) {
        return res.status(400).json({
          msg: "Business name already exists. Please choose another.",
        });
      }
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create user with extra info
    const user = await User.create({
      username,
      email,
      password: hashed,
      role: role || "customer",
      phone: phone || "",
      location: location || "",
      businessName: businessName || "",
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      message: "User registered",
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        businessName: user.businessName,
      },
    });
  } catch (err) {
    console.error("❌ Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- LOGIN ----------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Please provide all fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "No account found" });

    // If admin cleared the password (empty string), block login and instruct user to reset
    if (!user.password || user.password.length === 0) {
      return res.status(400).json({
        msg: "Password has been cleared by admin. Please contact admin on WhatsApp and set a new password via the Forgot Password page.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" });

    const { accessToken, refreshToken } = generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        businessName: user.businessName,
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ msg: err.message });
  }
});

// ---------------- UPDATE USER INFO ----------------
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, location, businessName } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (businessName !== undefined) user.businessName = businessName;

    await user.save();

    res.status(200).json({
      message: "User info updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        phone: user.phone,
        location: user.location,
        businessName: user.businessName,
      },
    });
  } catch (err) {
    console.error("❌ Update error:", err);
    res.status(500).json({ message: "Failed to update user info" });
  }
});

// ---------------- REFRESH TOKEN ----------------
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ msg: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ msg: "Invalid refresh token" });

    const { accessToken, refreshToken: newRefresh } = generateTokens(user);
    user.refreshToken = newRefresh;
    await user.save();

    res.json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(403).json({ msg: "Invalid or expired refresh token" });
  }
});

// ---------------- LOGOUT ----------------
router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ msg: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: "User not found" });

    user.refreshToken = null;
    await user.save();

    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ msg: "Error logging out" });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // If vendor — remove their products, promos, and related orders
    if (user.role === "vendor") {
      const vendorProducts = await Product.find({ vendor: id });

      // Delete product images from Cloudinary
      await Promise.all(
        vendorProducts.map(async (product) => {
          if (product.cloudinary_id) {
            try {
              await cloudinary.uploader.destroy(product.cloudinary_id);
            } catch (err) {
              console.warn(
                `⚠️ Failed to delete image ${product.cloudinary_id}:`,
                err.message
              );
            }
          }
        })
      );

      // Delete vendor's products & promos
      await Product.deleteMany({ vendor: id });
      await Promo.deleteMany({ vendor: id });

      // Remove vendor’s items from all orders
      const orders = await Order.find({ "items.vendor": id });
      for (const order of orders) {
        order.items = order.items.filter(
          (item) => item.vendor?.toString() !== id.toString()
        );
        if (order.items.length === 0) {
          await order.deleteOne();
        } else {
          await order.save();
        }
      }
    }

    // If customer — delete their orders
    if (user.role === "customer") {
      await Order.deleteMany({ user: id });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      message:
        "Your account and all related data have been deleted successfully.",
    });
  } catch (error) {
    console.error("❌ Error deleting user account:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

// ---------------- USER STATUS ----------------
router.get("/status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select(
      "username email verified role phone location businessName"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      verified: user.verified,
      username: user.username,
      role: user.role,
      email: user.email,
      phone: user.phone || "Not added yet",
      location: user.location || "No location set",
      businessName: user.businessName || "Not added yet",
    });
  } catch (err) {
    console.error("❌ Error fetching user status:", err);
    res.status(500).json({ message: "Failed to fetch user status" });
  }
});

// ------------------ RESET PASSWORD (after admin clears) ------------------
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Check if admin has cleared the password (resetAllowed = true)
    if (!user.resetAllowed) {
      return res.status(403).json({
        message:
          "Admin must first clear your password before you can set a new one.",
      });
    }

    // Hash new password and reset flag
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetAllowed = false; // disable further resets
    await user.save();

    res.status(200).json({
      message: "Password reset successful. You can now log in.",
    });
  } catch (err) {
    console.error("Error resetting password:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
