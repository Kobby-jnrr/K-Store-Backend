import express from "express";
import Promo from "../models/promo.js";

const router = express.Router();

// Get current active promo vendors
router.get("/", async (req, res) => {
  try {
    const promo = await Promo.findOne().sort({ startTime: -1 });
    if (!promo) return res.status(200).json({ vendorIds: [] });

    const endTime = new Date(promo.startTime);
    endTime.setHours(endTime.getHours() + promo.durationHours);

    if (new Date() > endTime) {
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
