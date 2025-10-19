import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/user.js";
import Product from "../models/product.js";
import Order from "../models/order.js";
import Promo from "../models/promo.js";

const router = express.Router();

/* ------------------ CLOUDINARY CONFIG ------------------ */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ------------------ DASHBOARD ------------------ */
router.get("/dashboard", verifyToken, verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin 🎓",
    user: req.user,
  });
});

/* ------------------ VENDORS ------------------ */
// Get all vendors
router.get("/vendors", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

// Verify / unverify vendor
router.put("/verify-vendor/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { verified } = req.body;

    const vendor = await User.findById(id);
    if (!vendor || vendor.role !== "vendor")
      return res.status(404).json({ message: "Vendor not found" });

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

// Add a new user
router.post("/users", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "Username, email, and password are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User with this email already exists" });

    const newUser = new User({ username, email, password, role: role || "customer" });
    await newUser.save();

    res.status(201).json({ message: "User created successfully", user: newUser });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Failed to add user" });
  }
});

// Update user role
router.put("/update-user-role/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findById(id);
    if (!user || user.role === "admin")
      return res.status(404).json({ message: "User not found or cannot update admin" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: `User role updated to ${role}` });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Delete a user (auto delete vendor products, promos, orders, and Cloudinary images)
router.delete("/users/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role === "admin") {
      return res.status(404).json({ message: "User not found or cannot delete admin" });
    }

    // If vendor — delete all related data and product images
    if (user.role === "vendor") {
      const vendorProducts = await Product.find({ vendor: id });

      // Delete each product's image from Cloudinary
      const imageDeletions = vendorProducts.map(async (product) => {
        if (product.cloudinary_id) {
          try {
            await cloudinary.uploader.destroy(product.cloudinary_id);
          } catch (err) {
            console.warn(`Failed to delete image ${product.cloudinary_id}:`, err.message);
          }
        }
      });

      await Promise.all([
        ...imageDeletions,
        Product.deleteMany({ vendor: id }),
        Promo.deleteMany({ vendor: id }),
        Order.deleteMany({ "items.vendor": id }),
      ]);
    }

    // If customer — delete all their orders
    if (user.role === "customer") {
      await Order.deleteMany({ user: id });
    }

    // Delete user
    await User.findByIdAndDelete(id);

    res.status(200).json({
      message: `User (${user.username}) and all associated data/images deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

/* ------------------ PRODUCTS ------------------ */
// Get all products
router.get("/products", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const products = await Product.find().populate("vendor", "username email");
    res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Update a product
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

// Delete a product (with Cloudinary image cleanup)
router.delete("/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete image from Cloudinary if exists
    if (product.cloudinary_id) {
      try {
        await cloudinary.uploader.destroy(product.cloudinary_id);
      } catch (err) {
        console.warn(`Failed to delete image ${product.cloudinary_id}:`, err.message);
      }
    }

    await product.deleteOne();
    res.status(200).json({ message: "Product and image deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
});

/* ------------------ ORDERS ------------------ */
// Get all orders
router.get("/orders", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "username email")
      .populate("items.product", "title price")
      .populate("items.vendor", "username email");

    res.status(200).json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

// Update order status
router.put("/orders/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order updated", order });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Failed to update order" });
  }
});

// Delete an order
router.delete("/orders/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Failed to delete order" });
  }
});

export default router;
