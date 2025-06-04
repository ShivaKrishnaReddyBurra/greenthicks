const express = require("express")
const User = require("../models/User")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

// Get delivery settings
router.get("/", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ globalId: req.user.globalId })

    const settings = user.deliverySettings || {
      notifications: {
        email: true,
        push: true,
        sms: false,
        sound: true,
        ringtone: "default",
      },
      app: {
        darkMode: false,
        navigationApp: "google-maps",
        inAppSounds: true,
        backgroundRefresh: true,
      },
      privacy: {
        twoFactorAuth: false,
        biometricLogin: false,
      },
    }

    res.json({
      success: true,
      settings,
    })
  } catch (error) {
    console.error("Error fetching settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
      error: error.message,
    })
  }
})

// Update notification settings
router.put("/notifications", authenticate, async (req, res) => {
  try {
    const { email, push, sms, sound, ringtone } = req.body

    const user = await User.findOne({ globalId: req.user.globalId })
    const currentSettings = user.deliverySettings || {}

    const updatedSettings = {
      ...currentSettings,
      notifications: {
        email,
        push,
        sms,
        sound,
        ringtone,
      },
    }

    await User.findOneAndUpdate({ globalId: req.user.globalId }, { deliverySettings: updatedSettings })

    res.json({
      success: true,
      message: "Notification settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating notification settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
      error: error.message,
    })
  }
})

// Update app settings
router.put("/app", authenticate, async (req, res) => {
  try {
    const { darkMode, navigationApp, inAppSounds, backgroundRefresh } = req.body

    const user = await User.findOne({ globalId: req.user.globalId })
    const currentSettings = user.deliverySettings || {}

    const updatedSettings = {
      ...currentSettings,
      app: {
        darkMode,
        navigationApp,
        inAppSounds,
        backgroundRefresh,
      },
    }

    await User.findOneAndUpdate({ globalId: req.user.globalId }, { deliverySettings: updatedSettings })

    res.json({
      success: true,
      message: "App settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating app settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update app settings",
      error: error.message,
    })
  }
})

// Update privacy settings
router.put("/privacy", authenticate, async (req, res) => {
  try {
    const { twoFactorAuth, biometricLogin } = req.body

    const user = await User.findOne({ globalId: req.user.globalId })
    const currentSettings = user.deliverySettings || {}

    const updatedSettings = {
      ...currentSettings,
      privacy: {
        twoFactorAuth,
        biometricLogin,
      },
    }

    await User.findOneAndUpdate({ globalId: req.user.globalId }, { deliverySettings: updatedSettings })

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
      settings: updatedSettings,
    })
  } catch (error) {
    console.error("Error updating privacy settings:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update privacy settings",
      error: error.message,
    })
  }
})

module.exports = router
