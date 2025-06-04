const express = require("express")
const router = express.Router()
const Setting = require("../models/Setting")
const authenticate = require("../middleware/authenticate")

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next()
  }
  return res.status(403).json({ message: "Access denied: Admins only" })
}

// Get all settings
router.get("/", authenticate, isAdmin, async (req, res) => {
  try {
    // Group settings by category
    const generalSettings = await Setting.findOne({ category: "general" })
    const paymentSettings = await Setting.findOne({ category: "payment" })
    const deliverySettings = await Setting.findOne({ category: "delivery" })
    const notificationSettings = await Setting.findOne({ category: "notification" })

    res.json({
      general: generalSettings ? generalSettings.settings : {},
      payment: paymentSettings ? paymentSettings.settings : {},
      delivery: deliverySettings ? deliverySettings.settings : {},
      notification: notificationSettings ? notificationSettings.settings : {},
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update settings by category
router.put("/:category", authenticate, isAdmin, async (req, res) => {
  try {
    const { category } = req.params
    const settingsData = req.body

    if (!["general", "payment", "delivery", "notification"].includes(category)) {
      return res.status(400).json({ message: "Invalid settings category" })
    }

    // Update or create settings document
    const settings = await Setting.findOneAndUpdate(
      { category },
      {
        category,
        settings: settingsData,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true },
    )

    res.json(settings)
  } catch (error) {
    console.error(`Error updating ${req.params.category} settings:`, error)
    res.status(500).json({ message: "Server error" })
  }
})

// Reset settings to default
router.post("/:category/reset", authenticate, isAdmin, async (req, res) => {
  try {
    const { category } = req.params

    if (!["general", "payment", "delivery", "notification"].includes(category)) {
      return res.status(400).json({ message: "Invalid settings category" })
    }

    // Define default settings for each category
    const defaultSettings = {
      general: {
        siteName: "Green Thicks",
        siteDescription: "Organic and fresh products delivered to your doorstep",
        contactEmail: "support@greenthicks.com",
        contactPhone: "+91 9876543210",
        address: "123 Main St, Hyderabad, 500001",
      },
      payment: {
        enableCashOnDelivery: true,
        enableUPI: true,
        enableCreditCard: true,
        minOrderAmount: 200,
        maxCashOnDeliveryAmount: 5000,
      },
      delivery: {
        freeDeliveryMinAmount: 500,
        deliveryCharge: 50,
        maxDeliveryDistance: 15,
        deliveryTimeSlots: "10:00 AM - 1:00 PM, 2:00 PM - 5:00 PM, 6:00 PM - 9:00 PM",
      },
      notification: {
        orderConfirmation: true,
        orderShipped: true,
        orderDelivered: true,
        lowStockAlert: true,
        newProductAlert: true,
        promotionalEmails: true,
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: true,
        soundAlerts: false,
        selectedRingtone: "default",
        selectedVibration: "default",
      },
    }

    // Update with default settings
    const settings = await Setting.findOneAndUpdate(
      { category },
      {
        category,
        settings: defaultSettings[category],
        updatedBy: req.user._id,
      },
      { new: true, upsert: true },
    )

    res.json(settings)
  } catch (error) {
    console.error(`Error resetting ${req.params.category} settings:`, error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
