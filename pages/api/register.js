// pages/api/register.js
import dbConnect from "../../utils/dbConnect";
import User from "../../models/User";
import { sendVerificationEmail, generateToken } from "../../utils/email";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { name, email, password } = req.body;

  await dbConnect();

  const existingUser = await User.findOne({ email });
  if (existingUser) return res.status(400).json({ error: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const token = generateToken();

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    verificationToken: token,
    verificationTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  await sendVerificationEmail(email, token);

  res.status(201).json({ message: "User registered. Verification email sent!" });
}