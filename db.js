// /config/db.js
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI;
if (!MONGO_URI) throw new Error("MONGODB_URI is missing");

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((mongoose) => {
      console.log("MongoDB Connected (via Mongoose)");
      return mongoose;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;