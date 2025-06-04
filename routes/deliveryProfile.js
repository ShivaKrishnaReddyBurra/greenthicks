const express = require("express")
const User = require("../models/User")
const authenticate = require("../middleware/authenticate")
const bcrypt = require("bcryptjs")

const router = express.Router()

// Get delivery profile
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ globalId: req.user.globalId }).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      profile: {
        globalId: user.globalId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        city: user.city,
        state: user.state,
        zipCode: user.zipCode,
        bio: user.bio,
        vehicleInfo: user.vehicleInfo || {},
        bankDetails: user.bankDetails || {},
        rating: user.rating || 4.8,
        joinDate: user.createdAt,
        isDeliveryBoy: user.isDeliveryBoy,
        activeStatus: user.activeStatus,
        achievements: user.achievements || [],
      },
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: error.message,
    })
  }
})

// Update personal info
router.put("/personal", authenticate, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, city, state, zipCode, bio } = req.body

    const user = await User.findOneAndUpdate(
      { globalId: req.user.globalId },
      {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        bio,
      },
      { new: true },
    ).select("-password")

    res.json({
      success: true,
      message: "Personal information updated successfully",
      profile: user,
    })
  } catch (error) {
    console.error("Error updating personal info:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update personal information",
      error: error.message,
    })
  }
})

// Update vehicle info
router.put("/vehicle", authenticate, async (req, res) => {
  try {
    const { vehicleType, make, model, year, color, licensePlate, insurance } = req.body

    const vehicleInfo = {
      vehicleType,
      make,
      model,
      year,
      color,
      licensePlate,
      insurance,
    }

    const user = await User.findOneAndUpdate({ globalId: req.user.globalId }, { vehicleInfo }, { new: true }).select(
      "-password",
    )

    res.json({
      success: true,
      message: "Vehicle information updated successfully",
      vehicleInfo: user.vehicleInfo,
    })
  } catch (error) {
    console.error("Error updating vehicle info:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update vehicle information",
      error: error.message,
    })
  }
})

// Update bank details
router.put("/bank", authenticate, async (req, res) => {
  try {
    const { accountName, bankName, accountNumber, routingNumber, taxId, paymentMethod } = req.body

    const bankDetails = {
      accountName,
      bankName,
      accountNumber: accountNumber.replace(/\d(?=\d{4})/g, "*"), // Mask account number
      routingNumber: routingNumber.replace(/\d(?=\d{4})/g, "*"), // Mask routing number
      taxId: taxId.replace(/\d(?=\d{4})/g, "*"), // Mask tax ID
      paymentMethod,
    }

    const user = await User.findOneAndUpdate({ globalId: req.user.globalId }, { bankDetails }, { new: true }).select(
      "-password",
    )

    res.json({
      success: true,
      message: "Bank details updated successfully",
      bankDetails: user.bankDetails,
    })
  } catch (error) {
    console.error("Error updating bank details:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update bank details",
      error: error.message,
    })
  }
})

// Change password
router.put("/password", authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await User.findOne({ globalId: req.user.globalId })

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await User.findOneAndUpdate({ globalId: req.user.globalId }, { password: hashedPassword })

    res.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (error) {
    console.error("Error updating password:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    })
  }
})

module.exports = router
