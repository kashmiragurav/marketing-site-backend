const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },

    verificationTokens: [
      {
        token:   { type: String, required: true },
        expires: { type: Date,   required: true },
        used:    { type: Boolean, default: false },
      },
    ],

    // RBAC roles — super_admin > admin > user
    role: {
      type:    String,
      enum:    ["super_admin", "admin", "user"],
      default: "user",
    },

    resetToken:        { type: String },
    resetTokenExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
