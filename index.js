// index.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./db"); // ✅ Database connection
const errorHandler = require("./middleware/errorHandler");
const authMiddleware = require("./middleware/authMiddleware");

// Routes
const ProductRoutes = require("./routes/ProductRoutes");
const authRoutes = require("./routes/authRoutes"); // single import

const app = express();

// ─── MIDDLEWARES ─────────────────────
app.use(express.json());
app.use(cookieParser());

// CORS: allow frontend to communicate and send cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000", // frontend URL
    credentials: true, // allow cookies to be sent
  })
);

// ─── ROUTES ─────────────────────────
app.use("/api/products", ProductRoutes);
app.use("/api/auth", authRoutes);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: `Hello ${req.user.email}, you accessed a protected route!`,
  });
});

// ─── GLOBAL ERROR HANDLER ──────────
app.use(errorHandler);

// ─── START SERVER ───────────────────
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to DB:", err);
  });