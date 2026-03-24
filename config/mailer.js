const nodemailer = require("nodemailer");

// Create a reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use Gmail App Password, not your real password
  },
});

module.exports = transporter;
