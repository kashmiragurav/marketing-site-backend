// Run: node scripts/seedProducts.js

require("dotenv").config();
const mongoose = require("mongoose");
const Product  = require("../models/Product");

const sampleProducts = [
  {
    title: "iPhone 15",
    description: "Latest Apple iPhone 15 with A16 chip",
    price: 79999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80",
    stock: 50,
    ratingsAverage: 4.5,
    ratingsCount: 120,
  },
  {
    title: "Samsung Galaxy S24",
    description: "Samsung flagship with 200MP camera",
    price: 74999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&q=80",
    stock: 30,
    ratingsAverage: 4.3,
    ratingsCount: 95,
  },
  {
    title: "Nike Air Max 270",
    description: "Comfortable running shoes with air cushion",
    price: 12999,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    stock: 100,
    ratingsAverage: 4.6,
    ratingsCount: 200,
  },
  {
    title: "Sony WH-1000XM5 Headphones",
    description: "Industry leading noise cancelling headphones",
    price: 29999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    stock: 20,
    ratingsAverage: 4.8,
    ratingsCount: 310,
  },
  {
    title: "Levi's 511 Slim Jeans",
    description: "Classic slim fit jeans in stretch denim",
    price: 3999,
    category: "Clothing",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&q=80",
    stock: 75,
    ratingsAverage: 4.2,
    ratingsCount: 88,
  },
  {
    title: "MacBook Air M2",
    description: "Apple MacBook Air with M2 chip, 8GB RAM",
    price: 114900,
    category: "Computers",
    image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=400&q=80",
    stock: 15,
    ratingsAverage: 4.9,
    ratingsCount: 450,
  },
  {
    title: "Instant Pot Duo 7-in-1",
    description: "Electric pressure cooker, slow cooker, rice cooker",
    price: 8999,
    category: "Kitchen",
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&q=80",
    stock: 40,
    ratingsAverage: 4.4,
    ratingsCount: 175,
  },
  {
    title: "Adidas Ultraboost 23",
    description: "High performance running shoes with Boost midsole",
    price: 16999,
    category: "Footwear",
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80",
    stock: 0,
    ratingsAverage: 4.7,
    ratingsCount: 260,
  },
  {
    title: "Canon EOS R50 Camera",
    description: "Mirrorless camera with 24.2MP sensor",
    price: 64999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80",
    stock: 10,
    ratingsAverage: 4.6,
    ratingsCount: 55,
  },
  {
    title: "IKEA KALLAX Shelf",
    description: "Versatile shelf unit for storage and display",
    price: 6999,
    category: "Furniture",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80",
    stock: 25,
    ratingsAverage: 4.1,
    ratingsCount: 140,
  },
  {
    title: "Whey Protein 2kg",
    description: "Chocolate flavour whey protein for muscle recovery",
    price: 2999,
    category: "Fitness",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&q=80",
    stock: 60,
    ratingsAverage: 4.3,
    ratingsCount: 320,
  },
  {
    title: "Kindle Paperwhite",
    description: "6.8 inch display, adjustable warm light, waterproof",
    price: 13999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80",
    stock: 35,
    ratingsAverage: 4.7,
    ratingsCount: 510,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected.");

    await Product.deleteMany({});
    console.log("Existing products cleared.");

    await Product.insertMany(sampleProducts);
    console.log(`✅ ${sampleProducts.length} products inserted successfully.`);

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
