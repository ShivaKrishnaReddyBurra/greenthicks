const express = require("express")
const passport = require("passport")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const {
  signup,
  login,
  updateUser,
  getAllUsers,
  getUserProfile,
  getUserDetails,
  deleteUser,
} = require("../controllers/authController")
const authenticate = require("../middleware/authenticate")
const { body, query, validationResult } = require("express-validator")
const User = require("../models/User")
const VerificationToken = require("../models/VerificationToken")
const crypto = require("crypto")
const { sendVerificationEmail, sendWelcomeEmail } = require("../services/emailService")

const router = express.Router()

router.post("/signup", signup)
router.post("/login", login)
router.put("/user/:globalId", authenticate, updateUser)
router.get("/users", authenticate, getAllUsers)
router.get("/profile", authenticate, getUserProfile)
router.get("/user/:globalId/details", authenticate, getUserDetails)
router.delete("/user/:globalId", authenticate, deleteUser)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }))
router.get("/google/callback", passport.authenticate("google", { session: false }), (req, res) => {
  const token = jwt.sign({ id: req.user.globalId, isAdmin: req.user.isAdmin }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  })
  res.redirect(`/?token=${token}`)
})

// Email verification endpoint
router.get(
  "/verify-email",
  [
    query("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    query("token").notEmpty().withMessage("Token is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, token } = req.query

    try {
      const verificationToken = await VerificationToken.findOne({ email, token })
      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired verification token" })
      }

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" })
      }

      user.isVerified = true
      await user.save()

      await VerificationToken.deleteOne({ email, token })

      res.json({ message: "Email verified successfully" })
      await sendWelcomeEmail(user.email)
    } catch (error) {
      console.error("Email verification error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

router.post(
  "/resend-verification",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required")],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email } = req.body

    try {
      const user = await User.findOne({ email })
      if (!user) return res.status(404).json({ message: "User not found" })
      if (user.isVerified) return res.status(400).json({ message: "Email is already verified" })

      await VerificationToken.deleteMany({ email }) // Remove any existing tokens

      const token = crypto.randomBytes(32).toString("hex")
      const verificationToken = new VerificationToken({
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      await verificationToken.save()

      await sendVerificationEmail(email, token)

      res.json({ message: "Verification email resent successfully" })
    } catch (error) {
      console.error("Resend verification error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Forgot password endpoint
router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail().withMessage("Valid email is required")],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email } = req.body

    try {
      const user = await User.findOne({ email })
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." })
      }

      // Remove any existing password reset tokens for this email
      await VerificationToken.deleteMany({ email, type: "password-reset" })

      const token = crypto.randomBytes(32).toString("hex")
      const verificationToken = new VerificationToken({
        email,
        token,
        type: "password-reset",
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
      })
      await verificationToken.save()

      await sendVerificationEmail(email, token, "password-reset")

      res.json({ message: "Password reset link has been sent to your email address." })
    } catch (error) {
      console.error("Forgot password error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Reset password endpoint
router.post(
  "/reset-password",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { email, token, password } = req.body

    try {
      const verificationToken = await VerificationToken.findOne({
        email,
        token,
        type: "password-reset",
      })

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired password reset token" })
      }

      const user = await User.findOne({ email })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Update password
      user.password = await bcrypt.hash(password, 10)
      await user.save()

      // Remove the used token
      await VerificationToken.deleteOne({ email, token, type: "password-reset" })

      res.json({ message: "Password reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Request email update
router.post(
  "/request-email-update",
  authenticate,
  [body("newEmail").isEmail().normalizeEmail().withMessage("Valid email is required")],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { newEmail } = req.body
    const userId = req.user.id

    try {
      // Check if new email is already in use
      const existingUser = await User.findOne({ email: newEmail })
      if (existingUser) {
        return res.status(400).json({ message: "Email is already in use" })
      }

      const user = await User.findOne({ globalId: userId })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Remove any existing email update tokens for this user
      await VerificationToken.deleteMany({ email: user.email, type: "email-update" })

      const token = crypto.randomBytes(32).toString("hex")
      const verificationToken = new VerificationToken({
        email: user.email,
        token,
        type: "email-update",
        newEmail: newEmail, // Store the new email in the token
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      await verificationToken.save()

      await sendVerificationEmail(newEmail, token, "email-update")

      res.json({ message: "Email update verification has been sent to your new email address." })
    } catch (error) {
      console.error("Request email update error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Verify email update
router.get(
  "/verify-email-update",
  [
    query("token").notEmpty().withMessage("Token is required"),
    query("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { token, email } = req.query

    try {
      const verificationToken = await VerificationToken.findOne({
        token,
        type: "email-update",
        newEmail: email,
      })

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired email update token" })
      }

      const user = await User.findOne({ email: verificationToken.email })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Check if new email is still available
      const existingUser = await User.findOne({ email: verificationToken.newEmail })
      if (existingUser) {
        await VerificationToken.deleteOne({ token, type: "email-update" })
        return res.status(400).json({ message: "Email is no longer available" })
      }

      // Update email
      user.email = verificationToken.newEmail
      await user.save()

      // Remove the used token
      await VerificationToken.deleteOne({ token, type: "email-update" })

      res.json({ message: "Email updated successfully" })
    } catch (error) {
      console.error("Verify email update error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Request phone update
router.post(
  "/request-phone-update",
  authenticate,
  [
    body("newPhone")
      .matches(/^(?:\+91)?[6-9]\d{9}$/)
      .withMessage("Phone number must be in Indian format (e.g., +91 9705045597)"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { newPhone } = req.body
    const userId = req.user.id

    try {
      // Check if new phone is already in use
      const existingUser = await User.findOne({ phone: newPhone })
      if (existingUser) {
        return res.status(400).json({ message: "Phone number is already in use" })
      }

      const user = await User.findOne({ globalId: userId })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Remove any existing phone update tokens for this user
      await VerificationToken.deleteMany({ email: user.email, type: "phone-update" })

      const token = crypto.randomBytes(32).toString("hex")
      const verificationToken = new VerificationToken({
        email: user.email,
        token,
        type: "phone-update",
        newPhone: newPhone, // Store the new phone in the token
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      })
      await verificationToken.save()

      await sendVerificationEmail(user.email, token, "phone-update")

      res.json({ message: "Phone number update verification has been sent to your email address." })
    } catch (error) {
      console.error("Request phone update error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

// Verify phone update
router.get(
  "/verify-phone-update",
  [
    query("token").notEmpty().withMessage("Token is required"),
    query("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    const { token, email } = req.query

    try {
      const verificationToken = await VerificationToken.findOne({
        token,
        type: "phone-update",
        email: email,
      })

      if (!verificationToken) {
        return res.status(400).json({ message: "Invalid or expired phone update token" })
      }

      const user = await User.findOne({ email: verificationToken.email })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Check if new phone is still available
      const existingUser = await User.findOne({ phone: verificationToken.newPhone })
      if (existingUser) {
        await VerificationToken.deleteOne({ token, type: "phone-update" })
        return res.status(400).json({ message: "Phone number is no longer available" })
      }

      // Update phone
      user.phone = verificationToken.newPhone
      await user.save()

      // Remove the used token
      await VerificationToken.deleteOne({ token, type: "phone-update" })

      res.json({ message: "Phone number updated successfully" })
    } catch (error) {
      console.error("Verify phone update error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
)

module.exports = router
