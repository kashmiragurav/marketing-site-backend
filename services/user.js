// /services/user.js
import User from "../models/User.js";
const connectDB = require("../config/db");
import bcrypt from "bcryptjs";

// Create a new user
export async function createUser({ name, email, password, isVerified = false, verificationToken, verificationTokenExpires }) {
  await connectDB();
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified,
    verificationToken,
    verificationTokenExpires,
  });
  return user._id;
}

// Find user by email
export async function findUserByEmail(email) {
  await connectDB();
  return User.findOne({ email });
}

// Find user by ID
export async function findUserById(id) {
  await connectDB();
  return User.findById(id);
}

// Update user
export async function updateUser(id, updateData) {
  await connectDB();
  return User.findByIdAndUpdate(id, updateData, { new: true });
}

// Find user by verification token (not expired)
export async function findUserByVerificationToken(token) {
  await connectDB();
  return User.findOne({
    verificationToken: token,
    verificationTokenExpires: { $gt: new Date() },
  });
}