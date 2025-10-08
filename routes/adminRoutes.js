import express from "express";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";
import User from "../models/user.js";

const router = express.Router();

/**
 * ✅ 1️⃣ Admin Dashboard Test Route
 * Checks if your token and admin middleware are working.
 */
router.get("/dashboard", verifyToken, verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin 🎓",
    user: req.user,
  });
});

/**
 * ✅ 2️⃣ Get All Vendors
 * Lets the admin view all vendor accounts.
 */
router.get("/vendors", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
});

/**
 * ✅ 3️⃣ Verify / Unverify a Vendor
 * PUT /api/admin/verify-vendor/:id
 * Example body: { "verified": true }
 */
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

export default router;
