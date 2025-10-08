import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});

export default router;
