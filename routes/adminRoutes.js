import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import User from "../models/user.js";
import Product from "../models/product.js"; // Make sure you have a Product model

const router = express.Router();

/* ------------------ DASHBOARD ------------------ */
router.get("/dashboard", verifyToken, verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin 🎓",
    user: req.user,
  });
});

/* ------------------ VENDORS ------------------ */
router.get("/vendors", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

router.put("/verify-vendor/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.verified = verified;
    await vendor.save();

    res.status(200).json({
      message: `Vendor ${verified ? "verified" : "unverified"} successfully`,
      vendor,
    });
  } catch (error) {
    console.error("Error verifying vendor:", error);
    res.status(500).json({ message: "Error verifying vendor" });
  }
});

/* ------------------ USERS ------------------ */
// Get all users (excluding admins)
router.get("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Update user role (customer <-> vendor)
router.put("/update-user-role/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user || user.role === "admin") return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

/* ------------------ PRODUCTS ------------------ */
// Get all products (admin)
router.get("/products", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find().populate("vendor", "username email");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Update a product (admin)
router.put("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product updated", product: updatedProduct });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
});

// Delete a product (admin)
router.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: "Product not found" });

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

export default router;
