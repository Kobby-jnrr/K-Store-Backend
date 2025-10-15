import express from "express";
import Promo from "../models/promo.js";

const router = express.Router();

// Get current active promo vendors
router.get("/", async (req, res) => {
  try {
    const promo = await Promo.findOne().sort({ startDate: -1 });
    if (!promo) return res.status(200).json({ vendorIds: [] });

    if (new Date() > promo.endDate) {
      // Promo expired
      return res.status(200).json({ vendorIds: [] });
    }

    res.status(200).json({ vendorIds: promo.vendorIds });
  } catch (err) {
    console.error("Error fetching promo:", err);
    res.status(500).json({ message: "Failed to fetch promo" });
  }
});


export default router;
