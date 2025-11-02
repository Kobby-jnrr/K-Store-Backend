import express from "express";
import Product from "../models/product.js";
import { verifyToken, verifyVendor } from "../middleware/authMiddleware.js";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";

const router = express.Router();

// -------------------- MULTER CONFIG --------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// -------------------- CLOUDINARY CONFIG --------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------------------- GET ALL PRODUCTS --------------------
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().populate("vendor", "username verified");
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

// -------------------- GET VENDOR PRODUCTS --------------------
router.get("/vendor", verifyToken, verifyVendor, async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user._id }).populate(
      "vendor",
      "username verified"
    );
    const result = products.map((p) => ({
      ...p.toObject(),
      vendorName: p.vendor?.username || "Unknown",
      vendorVerified: p.vendor?.verified || false,
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendor products", error: err.message });
  }
});

// -------------------- GET PRODUCTS BY CATEGORY --------------------
router.get("/:category", async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category: new RegExp(`^${category}$`, "i") }).populate(
      "vendor",
      "username verified"
    );
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

// GET PRODUCTS BY VENDOR (PUBLIC)
router.get("/vendor/:vendorId", async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.params.vendorId }).populate(
      "vendor",
      "username verified"
    );

    const result = products.map((p) => ({
      ...p.toObject(),
      vendorName: p.vendor?.username || "Unknown",
      vendorVerified: p.vendor?.verified || false,
      vendorId: p.vendor?._id || null,
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vendor products", error: err.message });
  }
});

// -------------------- ADD NEW PRODUCT (VENDOR ONLY) --------------------
router.post("/", verifyToken, verifyVendor, upload.single("image"), async (req, res) => {
  try {
    const { title, price, oldPrice, category, description } = req.body;

    if (!title || !price || !category || !req.file) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "kstore_products" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const product = new Product({
      title,
      price,
      oldPrice: oldPrice || null,
      category: category.toLowerCase(),
      description,
      image: result.secure_url,
      cloudinary_id: result.public_id,
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

// -------------------- UPDATE PRODUCT (VENDOR ONLY) --------------------
router.put("/:id", verifyToken, verifyVendor, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    if (req.file) {
      // Delete old image from Cloudinary
      if (product.cloudinary_id) {
        await cloudinary.uploader.destroy(product.cloudinary_id);
      }

      // Upload new image
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "kstore_products" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      req.body.image = result.secure_url;
      req.body.cloudinary_id = result.public_id;
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

// -------------------- DELETE PRODUCT (VENDOR ONLY) --------------------
router.delete("/:id", verifyToken, verifyVendor, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.vendor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    // Delete image from Cloudinary
    if (product.cloudinary_id) {
      await cloudinary.uploader.destroy(product.cloudinary_id);
    }

    await product.deleteOne();
    res.json({ message: "Product and image deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting product", error: err.message });
  }
});

export default router;
