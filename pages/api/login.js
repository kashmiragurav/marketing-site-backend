import { findUserByEmail } from "../../services/user";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { logger } from "../../config/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.status(200).json({ token, userId: user._id });
}

