const express = require("express")
const router = express.Router()
const authenticate = require("../middleware/authenticate")
const serviceAreaController = require("../controllers/serviceAreaController")

// Public routes
router.get("/", serviceAreaController.getAllServiceAreas)
router.get("/check", serviceAreaController.checkPincodeAvailability)
router.get("/nearby", serviceAreaController.getNearbyServiceAreas)
router.post("/check-location", serviceAreaController.checkLocationInServiceArea)

// Admin routes (require authentication)
router.post("/", authenticate, serviceAreaController.createServiceArea)
router.get("/:id", authenticate, serviceAreaController.getServiceAreaById)
router.put("/:id", authenticate, serviceAreaController.updateServiceArea)
router.delete("/:id", authenticate, serviceAreaController.deleteServiceArea)

module.exports = router