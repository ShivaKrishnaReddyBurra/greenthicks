const { body, validationResult } = require("express-validator")
const mongoose = require("mongoose")
const Order = require("../models/Order")
const User = require("../models/User")

// Get delivery locations for the authenticated delivery boy
const getDeliveryLocations = async (req, res) => {
  try {
    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Delivery boy or admin access required" })
    }

    // Get orders assigned to this delivery boy that are not delivered
    const query = req.user.isAdmin
      ? { deliveryStatus: { $in: ["assigned", "out-for-delivery"] } }
      : { deliveryBoyId: req.user.id, deliveryStatus: { $in: ["assigned", "out-for-delivery"] } }

    const orders = await Order.find(query).sort({ orderDate: 1 })

    const deliveryLocations = orders.map((order) => ({
      id: order.globalId,
      orderId: order.id,
      customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      address: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      zipCode: order.shippingAddress.zipCode,
      lat: order.shippingAddress.latitude ? Number.parseFloat(order.shippingAddress.latitude) : null,
      lng: order.shippingAddress.longitude ? Number.parseFloat(order.shippingAddress.longitude) : null,
      phone: order.shippingAddress.phone,
      items: order.items.length,
      total: order.total,
      status: order.deliveryStatus,
      orderDate: order.orderDate,
      customerPhone: order.shippingAddress.phone,
    }))

    res.json(deliveryLocations)
  } catch (error) {
    console.error("Get delivery locations error:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Get current location of the authenticated delivery boy
const getCurrentLocation = async (req, res) => {
  try {
    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Delivery boy or admin access required" })
    }

    const user = await User.findOne({ globalId: req.user.id })
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentLocation = {
      lat: user.currentLocation?.latitude || null,
      lng: user.currentLocation?.longitude || null,
      address: user.currentLocation?.address || user.address?.address || "Location not set",
      lastUpdated: user.currentLocation?.lastUpdated || null,
    }

    res.json(currentLocation)
  } catch (error) {
    console.error("Get current location error:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Update current location of the authenticated delivery boy
const updateDeliveryLocation = [
  body("latitude").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("longitude").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("address").optional().trim(),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Delivery boy or admin access required" })
    }

    const { latitude, longitude, address } = req.body

    try {
      const user = await User.findOne({ globalId: req.user.id })
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      user.currentLocation = {
        latitude,
        longitude,
        address: address || `${latitude}, ${longitude}`,
        lastUpdated: new Date(),
      }

      await user.save()

      res.json({
        message: "Location updated successfully",
        location: {
          lat: latitude,
          lng: longitude,
          address: user.currentLocation.address,
        },
      })
    } catch (error) {
      console.error("Update delivery location error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
]

// Optimize delivery route using nearest neighbor algorithm
const optimizeDeliveryRoute = async (req, res) => {
  try {
    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Delivery boy or admin access required" })
    }

    const user = await User.findOne({ globalId: req.user.id })
    if (!user || !user.currentLocation) {
      return res.status(400).json({ message: "Current location not set. Please share your location first." })
    }

    // Get pending deliveries
    const query = req.user.isAdmin
      ? { deliveryStatus: { $in: ["assigned", "out-for-delivery"] } }
      : { deliveryBoyId: req.user.id, deliveryStatus: { $in: ["assigned", "out-for-delivery"] } }

    const orders = await Order.find(query).sort({ orderDate: 1 })

    if (orders.length === 0) {
      return res.json({
        message: "No pending deliveries found",
        optimizedRoute: [],
        routeInfo: null,
      })
    }

    const currentLocation = {
      lat: user.currentLocation.latitude,
      lng: user.currentLocation.longitude,
    }

    // Calculate distances and optimize route
    const deliveriesWithDistance = orders.map((order) => {
      const deliveryLat = order.shippingAddress.latitude ? Number.parseFloat(order.shippingAddress.latitude) : null
      const deliveryLng = order.shippingAddress.longitude ? Number.parseFloat(order.shippingAddress.longitude) : null

      let distance = 0
      if (deliveryLat && deliveryLng) {
        // Calculate Haversine distance
        distance = calculateHaversineDistance(currentLocation.lat, currentLocation.lng, deliveryLat, deliveryLng)
      }

      return {
        id: order.globalId,
        orderId: order.id,
        customer: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
        address: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state}`,
        lat: deliveryLat,
        lng: deliveryLng,
        phone: order.shippingAddress.phone,
        items: order.items.length,
        total: order.total,
        status: order.deliveryStatus,
        distance: distance,
        distanceText: `${distance.toFixed(1)} km`,
        estimatedTime: Math.round(distance * 3), // Rough estimate: 3 minutes per km
      }
    })

    // Sort by distance (nearest first)
    const optimizedRoute = deliveriesWithDistance
      .filter((delivery) => delivery.lat && delivery.lng) // Only include deliveries with coordinates
      .sort((a, b) => a.distance - b.distance)
      .map((delivery, index) => ({
        ...delivery,
        order: index + 1,
        durationText: `${delivery.estimatedTime} min`,
        estimatedArrival: new Date(Date.now() + delivery.estimatedTime * 60000),
      }))

    const routeInfo = {
      totalDeliveries: optimizedRoute.length,
      totalDistance: optimizedRoute.reduce((sum, delivery) => sum + delivery.distance, 0).toFixed(1) + " km",
      totalTime: optimizedRoute.reduce((sum, delivery) => sum + delivery.estimatedTime, 0) + " min",
      startLocation: currentLocation,
    }

    res.json({
      message: "Route optimized successfully",
      optimizedRoute,
      routeInfo,
      currentLocation,
    })
  } catch (error) {
    console.error("Optimize delivery route error:", error.message)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Calculate distance matrix for advanced route optimization
const calculateDistanceMatrix = [
  body("origins").isArray().withMessage("Origins must be an array"),
  body("destinations").isArray().withMessage("Destinations must be an array"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

    if (!req.user.isDeliveryBoy && !req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Delivery boy or admin access required" })
    }

    const { origins, destinations } = req.body

    try {
      // Calculate distance matrix using Haversine formula
      const matrix = origins.map((origin) => {
        return destinations.map((destination) => {
          const distance = calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng)
          const duration = Math.round(distance * 3) // 3 minutes per km estimate

          return {
            distance: {
              text: `${distance.toFixed(1)} km`,
              value: Math.round(distance * 1000), // in meters
            },
            duration: {
              text: `${duration} min`,
              value: duration * 60, // in seconds
            },
            status: "OK",
          }
        })
      })

      res.json({
        status: "OK",
        rows: matrix.map((row) => ({ elements: row })),
      })
    } catch (error) {
      console.error("Calculate distance matrix error:", error.message)
      res.status(500).json({ message: "Server error", error: error.message })
    }
  },
]

// Helper function to calculate Haversine distance
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  return distance
}

module.exports = {
  getDeliveryLocations,
  getCurrentLocation,
  updateDeliveryLocation,
  optimizeDeliveryRoute,
  calculateDistanceMatrix,
}
