import express from "express";
import Promo from "../models/promo.js";
import Product from "../models/product.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// -------------------- GET ACTIVE PROMO --------------------
router.get("/", async (req, res) => {
  try {
    const promo = await Promo.findOne({ active: true }).sort({ startDate: -1 });

    if (!promo || new Date() > promo.endDate) {
      return res.status(200).json({ vendorIds: [], durationWeeks: 2, products: [] });
    }

    const products = await Product.aggregate([
      { $match: { vendor: { $in: promo.vendorIds } } },
      { $sample: { size: 7 } },
    ]);

    res.status(200).json({ vendorIds: promo.vendorIds, durationWeeks: promo.durationWeeks, products });
  } catch (err) {
    console.error("Error fetching promo:", err);
    res.status(500).json({ message: "Failed to fetch promo" });
  }
});

// -------------------- CREATE / UPDATE PROMO --------------------
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { vendorIds = [], durationWeeks = 2 } = req.body;

    if (!Array.isArray(vendorIds)) {
      return res.status(400).json({ message: "vendorIds must be an array" });
    }

    if (![1, 2, 3, 4].includes(durationWeeks)) {
      return res.status(400).json({ message: "Duration must be 1-4 weeks" });
    }

    // Deactivate all promos if vendorIds is empty
    if (vendorIds.length === 0) {
      await Promo.updateMany({ active: true }, { active: false });
      return res.status(200).json({ message: "All promos removed", vendorIds: [] });
    }

    // Otherwise, create or update promo
    const promo = new Promo({
      vendorIds,
      durationWeeks,
      startDate: new Date(),
      active: true,
    });

    await promo.save();
    res.status(201).json({ message: "Promo saved", promo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save promo" });
  }
});

// -------------------- REMOVE VENDOR FROM PROMO --------------------
router.delete("/:vendorId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const promo = await Promo.findOne({ vendorIds: vendorId, active: true });
    if (!promo) return res.status(404).json({ message: "Promo not found" });

    promo.vendorIds = promo.vendorIds.filter(id => id.toString() !== vendorId);
    if (promo.vendorIds.length === 0) promo.active = false;

    await promo.save();
    res.status(200).json({ message: "Vendor removed from promo", vendorIds: promo.vendorIds });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to deactivate promo" });
  }
});

export default router;
