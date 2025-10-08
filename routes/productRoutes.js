import express from "express";
import Product from "../models/product.js";
import { verifyToken, verifyVendor } from "../middleware/authMiddleware.js";

const router = express.Router();

/* =====================================================
   📦 GET all products
===================================================== */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find(); // fetch all products
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   📦 GET products by category
===================================================== */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({
      category: new RegExp(`^${category}$`, "i"),
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   ➕ ADD new product (vendor only)
===================================================== */
router.post("/", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { title, price, image, category, description } = req.body;

    if (!title || !price || !image || !category) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = new Product({
      title,
      price,
      image,
      category: category.toLowerCase(),
      description,
      vendor: req.user._id,
    });

    await product.save();
    res.status(201).json({ message: "Product added successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Error adding product", error: err.message });
  }
});

/* =====================================================
   ✏️ UPDATE product (vendor only)
===================================================== */
router.put("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, price, image, category, description } = req.body;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    if (title) product.title = title;
    if (price) product.price = price;
    if (image) product.image = image;
    if (category) product.category = category.toLowerCase();
    if (description) product.description = description;

    await product.save();
    res.json({ message: "Product updated successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
});

/* =====================================================
   ❌ DELETE product (vendor only)
===================================================== */
router.delete("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

export default router;
