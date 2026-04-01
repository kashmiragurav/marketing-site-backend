const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User"); // Mongoose model
const transporter = require("../config/mailer");

// ─── REGISTER WITH EMAIL VERIFICATION ─────────────────────────────
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpiry = new Date(Date.now() + 1 * 60 * 1000); // 15 minutes

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationTokens: [
        {
          token: verificationToken,
          expires: verificationExpiry,
          used: false,
        },
      ],
    });

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    console.log("Verification Link:", verificationLink);

    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `<p>Hi ${name},</p>
             <p>Please verify your email by clicking the link below. This link expires in 15 minutes.</p>
             <a href="${verificationLink}">${verificationLink}</a>`,
    });

    res.status(201).json({
      message:
        "Account created successfully. Please verify your email before logging in.",
      userId: user._id,
    });
  } catch (err) {
    next(err);
  }
}

// ─── VERIFY EMAIL ─────────────────────────────────────────────
async function verifyEmail(req, res, next) {
  try {
    const { token } = req.query;

    console.log("Incoming token:", token);

    if (!token) {
      return res.status(400).json({
        error: "MissingToken",
         message: "Verification token is required."
       });
    }

    const user = await User.findOne({
      "verificationTokens.token": token,
    });

    console.log("User found:", user);

    if (!user) {
      return res.status(400).json({
        error: "InvalidOrExpired",
        message: "Invalid verification link.",
      });
    }

    const tokenData = user.verificationTokens.find((t) => t.token === token);

    if (!tokenData || tokenData.used) {
      return res.status(200).json({
        error: "InvalidOrExpired",
        message: "Verification link is invalid or already used.",
        email: user.email,
        allowResend: true,
      });
    }
//tpken expired
    if (new Date(tokenData.expires) < new Date()) {
      return res.status(200).json({
        error: "Expired",
        message: "Verification link expired.",
        email: user.email,
        allowResend: true,
      });
    }

    // Mark as verified
    user.isVerified = true;
    tokenData.used = true;
    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully. You can now log in.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── RESEND VERIFICATION LINK ─────────────────────────────
async function resendVerification(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Remove expired tokens
    user.verificationTokens = user.verificationTokens.filter(
      (t) => new Date(t.expires) > new Date()
    );

    const newToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationTokens.push({
      token: newToken,
      expires: expiry,
      used: false,
    });

    // optional: keep last 5 tokens only
    user.verificationTokens = user.verificationTokens.slice(-5);

    await user.save();

    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${newToken}`;

    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Resend: Verify your email",
      html: `<p>Hello,</p>
             <p>Click below to verify your email:</p>
             <a href="${verificationLink}">${verificationLink}</a>
             <p>This link expires in 15 minutes.</p>`,
    });

    return res.json({
      success: true,
      message: "Verification email resent successfully.",
    });
  } catch (err) {
    next(err);
  }
}

// ─── LOGIN ─────────────────────────────────────────────
async function login(req, res, next) {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Email not registered. Please signup first." });

    if (!user.isVerified)
      return res.status(403).json({ message: "Please verify your email before logging in." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password." });

    // Normalise legacy roles to new enum values
    const roleMap = { customer: 'user', vendor: 'admin' }
    const role = roleMap[user.role] || user.role || 'user'

    const token = jwt.sign(
      { userId: user._id, id: user._id, _id: user._id, email: user.email, name: user.name, role },
      process.env.JWT_SECRET,
      { expiresIn: rememberMe ? "7d" : "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "lax",
      maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Login successful.", email: user.email, name: user.name, role, userId: user._id, _id: user._id });
  } catch (err) {
    next(err);
  }
}

// ─── ME ─────────────────────────────────────────────
function me(req, res) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ email: decoded.email, name: decoded.name, role: decoded.role, userId: decoded.userId, id: decoded.id || decoded.userId, _id: decoded._id || decoded.userId });
  } catch (err) {
    if (err.name === "TokenExpiredError") res.clearCookie("token");
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

// ─── LOGOUT ─────────────────────────────────────────────
function logout(req, res) {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  res.json({ message: "Logged out successfully." });
}

// ─── FORGOT PASSWORD ─────────────────────────────────────
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user)
      return res.json({ message: "If that email exists, a reset link has been sent." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpiry;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click the link to reset your password (expires in 1 hour):</p>
             <a href="${resetLink}">${resetLink}</a>`,
    });

    res.json({ message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
}

// ─── RESET PASSWORD ─────────────────────────────────────
async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ message: "Token and new password are required." });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset token." });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
}

// ─── CHANGE EMAIL ──────────────────────────────────────
async function changeEmail(req, res, next) {
  try {
    const { oldEmail, newEmail, password } = req.body;
    if (!oldEmail || !newEmail || !password)
      return res.status(400).json({ message: "oldEmail, newEmail, and password are required." });

    const user = await User.findOne({ email: oldEmail });
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password." });

    const emailTaken = await User.findOne({ email: newEmail });
    if (emailTaken) return res.status(409).json({ message: "New email is already in use." });

    user.email = newEmail;
    await user.save();

    res.json({ message: "Email updated successfully." });
  } catch (err) {
    next(err);
  }
}

// ─── GET ALL USERS ─────────────────────────────────────
async function getAllUsers(req, res, next) {
  try {
    const users = await User.find({}, {
      password: 0,
      resetToken: 0,
      verificationTokens: 0,
    });
    res.json({ count: users.length, users });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  resendVerification,
  me,
  logout,
  forgotPassword,
  resetPassword,
  changeEmail,
  getAllUsers,
};
