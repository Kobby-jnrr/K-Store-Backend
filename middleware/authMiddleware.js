import { verifyToken } from "./verifyToken.js";
import User from "../models/user.js";

// Re-export verifyToken
export { verifyToken };

// ✅ Vendor middleware (all vendors allowed, verified not required)
export const verifyVendor = async (req, res, next) => {
  try {
    const user = req.user || (await User.findById(req.user._id));
    if (!user || user.role !== "vendor") {
      return res.status(403).json({ message: "Access denied. Vendors only." });
    }
    next();
  } catch (error) {
    console.error("Vendor verification error:", error);
    res.status(500).json({ message: "Server error verifying vendor access" });
  }
};

// ✅ Admin middleware
export const verifyAdmin = async (req, res, next) => {
  try {
    const user = req.user || (await User.findById(req.user._id));
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }
    next();
  } catch (error) {
    console.error("Admin verification error:", error);
    res.status(500).json({ message: "Server error verifying admin access" });
  }
};

/**
 * ✅ Verify Buyer Access
 * Allows only users with role === 'buyer' (students)
 */
export const verifyBuyer = async (req, res, next) => {
  try {
    const user = req.user || (await User.findById(req.user._id));

    if (!user || user.role !== "buyer") {
      return res.status(403).json({ message: "Access denied. Buyers only." });
    }

    next();
  } catch (error) {
    console.error("Buyer verification error:", error);
    res.status(500).json({ message: "Server error verifying buyer access" });
  }
};

/**
 * 🧠 Universal Role Checker
 * You can use this if you want a single middleware to check for any allowed roles.
 *
 * Example:
 * router.post("/approve", verifyToken, authorizeRoles("admin", "vendor"), handler);
 */
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user || (await User.findById(req.user._id));

      if (!user || !allowedRoles.includes(user.role)) {
        return res
          .status(403)
          .json({ message: "Access denied. Insufficient permissions." });
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({ message: "Server error verifying role access" });
    }
  };
};
