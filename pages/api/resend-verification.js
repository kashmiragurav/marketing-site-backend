// pages/api/resend-verification.js
const express = require("express"); // or use Next.js API handler if not Express
const User = require("../../models/User");
const crypto = require("crypto");
const transporter = require("../../config/mailer");

async function resendVerification(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (user.isVerified)
      return res.status(400).json({ message: "User is already verified." });

    // Generate new token and expiry
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationExpiry;
    await user.save();

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `<p>Hi ${user.name},</p>
             <p>Please verify your email by clicking the link below. This link expires in 15 minutes.</p>
             <a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.json({ message: "Verification email resent successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong." });
  }
}

module.exports = resendVerification;