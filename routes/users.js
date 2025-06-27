const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendVerificationEmail } = require("../services/emailService"); // Assuming email.js is in the same directory

// Get all users (admin only)
router.get("/", authenticate, async (req, res) => {
  try {
    // Add role-based access control if needed
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user by globalId
router.get("/:globalId", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ globalId: req.params.globalId }).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update user
router.put("/:globalId", authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin && req.user.globalId !== req.params.globalId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await User.findOneAndUpdate(
      { globalId: req.params.globalId },
      { $set: req.body },
      { new: true }
    ).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete user
router.delete("/:globalId", authenticate, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied: Admins only" });
    }
    const user = await User.findOneAndDelete({ globalId: req.params.globalId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request Password Reset
router.post("/request-password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(resetToken)
      .digest("hex");
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    // Store hashed token and expiry in user document
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send reset email
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(email)}`;
    await sendVerificationEmail(email, resetToken, "Reset Your Password", `
      <p>You requested a password reset for your GreenThicks account. Click the link below to reset your password:</p>
      <a href="${resetLink}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
      <p>If you didn’t request this, please ignore this email. The link expires in 1 hour.</p>
    `);

    res.json({ message: "Password reset link sent to your email" });
  } catch (error) {
    console.error("Request password reset error:", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ message: "Email, token, and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const resetTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      email,
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request Email Update
router.post("/request-email-update", authenticate, async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return res.status(400).json({ message: "Valid new email is required" });
    }

    const user = await User.findOne({ globalId: req.user.globalId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.email === newEmail) {
      return res.status(400).json({ message: "New email must be different from current email" });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(verificationToken)
      .digest("hex");
    const verificationTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    // Store verification token and new email
    user.pendingEmail = newEmail;
    user.emailVerificationToken = verificationTokenHash;
    user.emailVerificationExpires = verificationTokenExpiry;
    await user.save();

    // Send verification email
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email-update?token=${encodeURIComponent(verificationToken)}&email=${encodeURIComponent(newEmail)}`;
    await sendVerificationEmail(newEmail, verificationToken, "Verify Your New Email", `
      <p>You requested to update your email for your GreenThicks account. Click the link below to verify your new email:</p>
      <a href="${verificationLink}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Email</a>
      <p>If you didn’t request this, please ignore this email. The link expires in 1 hour.</p>
    `);

    res.json({ message: "Verification link sent to your new email" });
  } catch (error) {
    console.error("Request email update error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user.globalId,
      newEmail: req.body.newEmail,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify Email Update
router.post("/verify-email-update", async (req, res) => {
  try {
    const { email, token } = req.body;
    if (!email || !token) {
      return res.status(400).json({ message: "Email and token are required" });
    }

    const verificationTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      pendingEmail: email,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Update email
    user.email = user.pendingEmail;
    user.pendingEmail = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("Verify email update error:", {
      message: error.message,
      stack: error.stack,
      email: req.body.email,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Request Phone Update
router.post("/request-phone-update", authenticate, async (req, res) => {
  try {
    const { newPhone } = req.body;
    if (!newPhone || !/^(?:\+91\s?)?[6-9]\d{9}$/.test(newPhone)) {
      return res.status(400).json({ message: "Valid Indian phone number is required" });
    }

    const user = await User.findOne({ globalId: req.user.globalId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phone === newPhone) {
      return res.status(400).json({ message: "New phone number must be different from current phone number" });
    }

    const existingUser = await User.findOne({ phone: newPhone });
    if (existingUser) {
      return res.status(400).json({ message: "Phone number already in use" });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(verificationToken)
      .digest("hex");
    const verificationTokenExpiry = Date.now() + 3600000; // 1 hour expiry

    // Store verification token and new phone
    user.pendingPhone = newPhone;
    user.phoneVerificationToken = verificationTokenHash;
    user.phoneVerificationExpires = verificationTokenExpiry;
    await user.save();

    // For simplicity, send verification link via email (SMS integration could be added later)
    const verificationLink = `${process.env.FRONTEND_URL}/verify-phone-update?token=${encodeURIComponent(verificationToken)}&phone=${encodeURIComponent(newPhone)}`;
    await sendVerificationEmail(user.email, verificationToken, "Verify Your New Phone Number", `
      <p>You requested to update your phone number for your GreenThicks account. Click the link below to verify your new phone number:</p>
      <a href="${verificationLink}" style="background: linear-gradient(to right, #2ecc71, #27ae60); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block;">Verify Phone Number</a>
      <p>If you didn’t request this, please ignore this email. The link expires in 1 hour.</p>
    `);

    res.json({ message: "Verification link sent to your email" });
  } catch (error) {
    console.error("Request phone update error:", {
      message: error.message,
      stack: error.stack,
      userId: req.user.globalId,
      newPhone: req.body.newPhone,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Verify Phone Update
router.post("/verify-phone-update", async (req, res) => {
  try {
    const { phone, token } = req.body;
    if (!phone || !token) {
      return res.status(400).json({ message: "Phone and token are required" });
    }

    const verificationTokenHash = crypto
      .createHmac("sha256", process.env.RESET_TOKEN_SECRET)
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      pendingPhone: phone,
      phoneVerificationToken: verificationTokenHash,
      phoneVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    // Update phone
    user.phone = user.pendingPhone;
    user.pendingPhone = undefined;
    user.phoneVerificationToken = undefined;
    user.phoneVerificationExpires = undefined;
    await user.save();

    res.json({ message: "Phone number updated successfully" });
  } catch (error) {
    console.error("Verify phone update error:", {
      message: error.message,
      stack: error.stack,
      phone: req.body.phone,
    });
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;