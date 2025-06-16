const express = require("express")
const router = express.Router()
const authenticate = require("../middleware/authenticate")
const deliveryMapController = require("../controllers/deliveryMapController")

// Get delivery locations for the authenticated delivery boy
router.get("/locations", authenticate, deliveryMapController.getDeliveryLocations)

// Get current location of the authenticated delivery boy
router.get("/location", authenticate, deliveryMapController.getCurrentLocation)

// Update current location of the authenticated delivery boy
router.put("/locations", authenticate, deliveryMapController.updateDeliveryLocation)

// Get optimized route for deliveries
router.post("/optimize-route", authenticate, deliveryMapController.optimizeDeliveryRoute)

// Calculate distance matrix for route optimization
router.post("/distance-matrix", authenticate, deliveryMapController.calculateDistanceMatrix)

module.exports = router
