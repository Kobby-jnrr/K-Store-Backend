import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));

const products = [
  {
    title: "iPhone 15 Pro",
    price: 1199,
    image: "https://example.com/iphone15.jpg",
    category: "electronics",
    description: "Apple's latest flagship smartphone",
  },
  {
    title: "Running Shoes",
    price: 89,
    image: "https://example.com/shoes.jpg",
    category: "fashion",
    description: "Lightweight running shoes with excellent support",
  },
  {
    title: "Organic Face Cream",
    price: 25,
    image: "https://example.com/cream.jpg",
    category: "beauty",
    description: "Natural moisturizing face cream",
  },
];

async function seed() {
  try {
    await Product.deleteMany(); // optional: clear existing data
    await Product.insertMany(products);
    console.log("✅ Products added successfully!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
