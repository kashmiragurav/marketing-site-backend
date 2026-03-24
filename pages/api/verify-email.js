import { findUserByVerificationToken, updateUser } from "../../services/user";

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

  const { token } = req.query;
  if (!token) return res.status(400).json({ message: "Token is required" });

  const user = await findUserByVerificationToken(token);
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired verification link" });
  }

  await updateUser(user._id, {
    isVerified: true,
    verificationToken: null,
    verificationTokenExpires: null,
  });

  res.status(200).json({ message: "Email verified successfully. You can now login." });
}