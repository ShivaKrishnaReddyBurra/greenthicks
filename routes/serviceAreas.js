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
  getActiveServiceAreas
} = require("../controllers/serviceAreaController");

// Get all service areas
router.get("/", getAllServiceAreas);

// Get service area by ID
router.get("/:id", getServiceAreaById);

// Get service area by pincode (for lookup)
router.get("/pincode/:pincode", getServiceAreaByPincode);

// Create a new service area (admin only)
router.post("/", authenticate, createServiceArea);

// Update a service area by ID (admin only)
router.put("/:id", authenticate, updateServiceArea);

// Delete a service area by ID (admin only)
router.delete("/:id", authenticate, deleteServiceArea);

// Check if a location is within any service area
router.post("/check-location", checkLocationInServiceArea);

// Get all active service areas (public)
router.get("/active/all", getActiveServiceAreas);

module.exports = router;