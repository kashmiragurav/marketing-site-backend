require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");

// ─────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────
const categories = [
  "Electronics",
  "Clothing",
  "Footwear",
  "Kitchen",
  "Furniture",
  "Fitness",
  "Computers",
  "Books",
  "Beauty",
  "Toys",
];

const brands = [
  "Apple",
  "Samsung",
  "Sony",
  "Dell",
  "HP",
  "Nike",
  "Adidas",
  "Puma",
  "IKEA",
  "LG",
  "Philips",
  "Lenovo",
  "Asus",
  "Boat",
  "JBL",
  "Generic",
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function generateDescription(title, category) {
  return `${title} is a premium quality product in the ${category} category. Designed for durability and performance, it offers excellent usability for both personal and professional needs. Built using high-quality materials, it ensures long-lasting reliability and modern functionality. Ideal for everyday usage with a stylish and user-friendly design.`;
}

function generateProducts(count = 300) {
  const products = [];

  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length];
    const brand = brands[i % brands.length];

    products.push({
      title: `${brand} ${category} Product ${i}`,
      description: generateDescription(
        `${brand} ${category} Product ${i}`,
        category
      ),
      price: Math.floor(Math.random() * 100000) + 500,
      category,
      image: `https://picsum.photos/seed/${brand}-${category}-${i}/400/400`,
      stock: Math.floor(Math.random() * 20),
      tags: [category.toLowerCase(), brand.toLowerCase()],
      brand,
      sku: `SKU-${String(i).padStart(4, "0")}`,
      ratingsAverage: 0,
      ratingsCount: 0,
      isActive: true,
    });
  }

  return products;
}

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────
async function seed() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");

    console.log("🧹 Clearing old products...");
    await Product.deleteMany({});

    // ✅ STEP 1: Fetch users
    const users = await User.find();

    if (!users.length) {
      throw new Error("❌ No users found. Please create at least one user first.");
    }

    const products = generateProducts(300);

    console.log("📦 Inserting 300 products...");

    // ✅ STEP 2: Assign products to users (important!)
    const productsWithUser = products.map((product, index) => ({
      ...product,
      createdBy: users[index % users.length]._id,
    }));

    // ✅ STEP 3: Insert into DB
    const result = await Product.insertMany(productsWithUser);

    console.log(`✅ Successfully inserted ${result.length} products`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Insert failed");

    if (err.writeErrors) {
      err.writeErrors.forEach((e, i) => {
        console.log(`Error ${i + 1}:`, e.errmsg);
      });
    } else {
      console.error(err.message);
    }

    process.exit(1);
  }
}

seed();