// routes/serviceAreaRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const {
  getAllServiceAreas,
  getServiceAreaById,
  getServiceAreaByPincode,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  checkLocationInServiceArea,
  getActiveServiceAreas,
  getServiceAreas, // New
  checkPincode, // New
  getNearbyServiceAreas, // New
} = require("../controllers/serviceAreaController");

// Existing routes
router.get("/", getAllServiceAreas);
router.get("/:id", getServiceAreaById);
router.get("/pincode/:pincode", getServiceAreaByPincode);
router.post("/", authenticate, createServiceArea);
router.put("/:id", authenticate, updateServiceArea);
router.delete("/:id", authenticate, deleteServiceArea);
router.post("/check-location", checkLocationInServiceArea);
router.get("/active/all", getActiveServiceAreas);

// New routes for frontend
router.get("/service-areas", getServiceAreas); // Supports limit and active query params
router.get("/check-pincode/:pincode", checkPincode); // Check pincode availability
router.get("/nearby", getNearbyServiceAreas); // Get nearby service areas

module.exports = router;