const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

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

module.exports = router;