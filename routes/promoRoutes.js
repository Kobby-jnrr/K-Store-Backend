import express from "express";
import Promo from "../models/promo.js";
import Product from "../models/product.js";
import { verifyToken, verifyAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get active promo and random products
router.get("/", async (req, res) => {
  try {
    // Find the latest active promo
    const promo = await Promo.findOne({ active: true }).sort({ startDate: -1 });

    // No active promo or promo expired
    if (!promo || new Date() > promo.endDate) {
      return res.status(200).json({ vendorIds: [], products: [] });
    }

    // Random 6–7 products from all active vendors
    const products = await Product.aggregate([
      { $match: { vendor: { $in: promo.vendorIds } } },
      { $sample: { size: 7 } },
    ]);

    res.status(200).json({ vendorIds: promo.vendorIds, products });
  } catch (err) {
    console.error("Error fetching promo:", err);
    res.status(500).json({ message: "Failed to fetch promo" });
  }
});

// Create / update promo for one or more vendors
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { vendorIds, durationWeeks } = req.body;

    if (!vendorIds || !vendorIds.length)
      return res.status(400).json({ message: "Select at least one vendor" });

    if (![1, 2, 3, 4].includes(durationWeeks))
      return res.status(400).json({ message: "Duration must be 1-4 weeks" });

    // Create new promo
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

// Deactivate a promo for a vendor
router.delete("/:vendorId", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const promo = await Promo.findOne({ vendorIds: vendorId, active: true });
    if (!promo) return res.status(404).json({ message: "Promo not found" });

    promo.vendorIds = promo.vendorIds.filter(id => id.toString() !== vendorId);
    if (promo.vendorIds.length === 0) promo.active = false;

    await promo.save();
    res.status(200).json({ message: "Promo deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to deactivate promo" });
  }
});

export default router;
