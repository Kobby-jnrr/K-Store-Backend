import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Path to a local image you want to test
const testImagePath = path.join(process.cwd(), "shirts.jpg"); // <-- replace with your image

async function testUpload() {
  try {
    if (!fs.existsSync(testImagePath)) {
      console.error("❌ Test image not found at:", testImagePath);
      return;
    }

    const result = await cloudinary.uploader.upload(testImagePath, {
      folder: "kstore_test",
    });

    console.log("✅ Upload successful!");
    console.log("Image URL:", result.secure_url);
  } catch (err) {
    console.error("🔥 Upload failed:", err.message);
  }
}

testUpload();
