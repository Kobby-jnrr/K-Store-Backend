import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

console.log("Cloudinary API Key:", process.env.CLOUDINARY_API_KEY);

// -------------------- CONFIG --------------------
const API_URL = "http://localhost:5000/api/products"; // your API endpoint
const JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZTg2YTIzZWMxZjNkZGZkM2UxZjI0OSIsInJvbGUiOiJ2ZW5kb3IiLCJpYXQiOjE3NjA2ODQxMTgsImV4cCI6MTc2MDY5NDkxOH0.Mne-Q1e4r25ZikmhQSBNozcgC3FyS5wj_NF4E1Bzrg8"; // replace with a valid vendor token
const IMAGE_PATH = "./shirts.jpg"; // path to the image you want to upload

// -------------------- CREATE FORM DATA --------------------
const form = new FormData();
form.append("title", "Real Madrid");
form.append("price", "200");
form.append("category", "sports");
form.append("description", "Cool football shirt");
form.append("image", fs.createReadStream(IMAGE_PATH));

// Optional: include promo as JSON string
const promo = {
  isActive: true,
  type: "discount",
  discountPercentage: 10,
  discountAmount: 0,
  buyQuantity: 1,
  getQuantity: 1,
  promoDescription: "10% off!"
};
form.append("promo", JSON.stringify(promo));

// -------------------- SEND REQUEST --------------------
axios
  .post(API_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${JWT_TOKEN}`,
    },
  })
  .then((res) => {
    console.log("✅ Product uploaded successfully:");
    console.log(res.data);
  })
  .catch((err) => {
    console.error("❌ Error uploading product:");
    console.error(err.response ? err.response.data : err.message);
  });
