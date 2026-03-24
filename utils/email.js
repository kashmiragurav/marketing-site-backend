// utils/email.js
import nodemailer from "nodemailer";

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "Gmail", // or other SMTP
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Email",
    html: `
      <p>Click the link below to verify your email:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });
};

export const generateToken = () => {
  return Math.random().toString(36).substring(2, 15); // simple token
};