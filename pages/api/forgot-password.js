import { generateResetToken } from "../../services/user";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { email } = req.body;
  const token = await generateResetToken(email);
  if (!token) return res.status(400).json({ message: "User not found" });

  // Send token via email here (omitted)
  res.status(200).json({ message: "Password reset email sent" });
}