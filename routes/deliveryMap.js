const express = require("express");
const Order = require("../models/Order");
const User = require("../models/User");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

// Get delivery locations for map
router.get("/locations", authenticate, async (req, res) => {
  try {
    const deliveryBoyId = req.user?.globalId;
    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    const orders = await Order.find({
      deliveryBoy: deliveryBoyId,
      deliveryStatus: { $in: ["assigned", "out-for-delivery"] },
    }).populate("user", "firstName lastName email phone");

    const locations = orders.map((order) => ({
      id: order.globalId,
      orderId: order.id,
      customer: `${order.user.firstName} ${order.user.lastName}`,
      customerPhone: order.user.phone,
      address: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
      fullAddress: order.shippingAddress,
      lat: order.shippingAddress.latitude || 17.385 + (Math.random() - 0.5) * 0.1,
      lng: order.shippingAddress.longitude || 78.4867 + (Math.random() - 0.5) * 0.1,
      status: order.deliveryStatus,
      orderDate: order.orderDate,
      total: order.total,
      items: order.items.length,
    }));

    res.json({
      success: true,
      locations,
      totalDeliveries: locations.length,
    });
  } catch (error) {
    console.error("Error fetching delivery locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch delivery locations",
      error: error.message,
    });
  }
});

// Update delivery boy location
router.post("/update-location", authenticate, async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;
    const deliveryBoyId = req.user?.globalId;

    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    await User.findOneAndUpdate(
      { globalId: deliveryBoyId },
      {
        currentLocation: {
          latitude,
          longitude,
          address: address || "Unknown address",
          updatedAt: new Date(),
        },
      }
    );

    res.json({
      success: true,
      message: "Location updated successfully",
    });
  } catch (error) {
    console.error("Error updating location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update location",
      error: error.message,
    });
  }
});

// Get current location
router.get("/current-location", authenticate, async (req, res) => {
  try {
    const deliveryBoyId = req.user?.globalId;

    if (!deliveryBoyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID not found",
      });
    }

    const user = await User.findOne({ globalId: deliveryBoyId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      location: user.currentLocation || {
        latitude: 17.385,
        longitude: 78.4867,
        address: "Hyderabad, Telangana, India",
      },
    });
  } catch (error) {
    console.error("Error fetching current location:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch current location",
      error: error.message,
    });
  }
});

module.exports = router;