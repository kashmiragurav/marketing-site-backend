// Run this script once to create a unique index on the email field
// Command: node scripts/createIndexes.js

require("dotenv").config();
const { connectDB, getDB } = require("../db");

async function createIndexes() {
  await connectDB();
  const db = getDB();
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  console.log("Unique index on 'email' created successfully.");
  process.exit(0);
}

createIndexes().catch((err) => {
  console.error(err);
  process.exit(1);
});
