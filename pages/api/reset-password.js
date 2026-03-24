import { findUserByResetToken, updateUser } from "../../services/user";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  const { token, newPassword } = req.body;
  const user = await findUserByResetToken(token);
  if (!user) return res.status(400).json({ message: "Invalid or expired token" });

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUser(user._id, { password: hashedPassword, ResetPasswordToken: null, ResetPasswordExpiry: null });

  res.status(200).json({ message: "Password reset successfully" });
}