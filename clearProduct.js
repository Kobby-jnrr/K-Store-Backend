import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.js"; // adjust path if needed

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

async function clearProducts() {
  try {
    const result = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${result.deletedCount} products`);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearProducts();
