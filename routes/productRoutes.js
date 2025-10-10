import express from "express";
import Product from "../models/product.js";
import { verifyToken, verifyVendor } from "../middleware/authMiddleware.js";
import User from "../models/user.js";

const router = express.Router();

/* =====================================================
   GET all products (with vendor info)
===================================================== */
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("vendor", "username verified");
    // Map vendor fields for frontend convenience
    const result = products.map((p) => ({
      ...p.toObject(),
      vendorName: p.vendor?.username || "Unknown",
      vendorVerified: p.vendor?.verified || false,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   GET products by category
===================================================== */
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category: new RegExp(`^${category}$`, "i") })
                                  .populate("vendor", "username verified");

    const result = products.map((p) => ({
      ...p.toObject(),
      vendorName: p.vendor?.username || "Unknown",
      vendorVerified: p.vendor?.verified || false,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =====================================================
   ADD new product (vendor only)
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
    await product.populate("vendor", "username verified");

    res.status(201).json({
      message: "Product added successfully",
      product: {
        ...product.toObject(),
        vendorName: product.vendor.username,
        vendorVerified: product.vendor.verified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error adding product", error: err.message });
  }
});

/* =====================================================
   UPDATE product (vendor only)
===================================================== */
router.put("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    Object.assign(product, req.body);
    await product.save();
    await product.populate("vendor", "username verified");

    res.json({
      message: "Product updated successfully",
      product: {
        ...product.toObject(),
        vendorName: product.vendor.username,
        vendorVerified: product.vendor.verified,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error updating product", error: err.message });
  }
});

/* =====================================================
   DELETE product (vendor only)
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
