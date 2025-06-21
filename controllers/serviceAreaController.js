// controllers/serviceAreaController.js
const { body, param, query, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const ServiceArea = require("../models/ServiceArea");

// Get all service areas
const getAllServiceAreas = async (req, res) => {
  try {
    const serviceAreas = await ServiceArea.find();
    res.json(serviceAreas);
  } catch (error) {
    console.error("Get all service areas error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a specific service area by ID
const getServiceAreaById = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const serviceArea = await ServiceArea.findById(req.params.id);
      if (!serviceArea) {
        return res.status(404).json({ message: "Service area not found" });
      }
      res.json(serviceArea);
    } catch (error) {
      console.error("Get service area error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Get service areas by pincode (returns multiple if duplicates exist)
const getServiceAreaByPincode = [
  param("pincode").notEmpty().trim().withMessage("Pincode is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const serviceAreas = await ServiceArea.find({ pincode: req.params.pincode });
      if (!serviceAreas.length) {
        return res.status(404).json({ message: "No service areas found for this pincode" });
      }
      res.json(serviceAreas);
    } catch (error) {
      console.error("Get service area by pincode error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Create a new service area (admin only)
const createServiceArea = [
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("description").optional().trim(),
  body("centerLocation").isObject().withMessage("Center location must be an object"),
  body("centerLocation.lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("centerLocation.lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("deliveryRadius").isNumeric().custom((value) => value >= 0.1).withMessage("Delivery radius must be at least 0.1 km"),
  body("isActive").optional().isBoolean().withMessage("Active must be a boolean"),
  body("deliveryFee").optional().isNumeric().withMessage("Delivery fee must be a number"),
  body("minimumOrderAmount").optional().isNumeric().withMessage("Minimum order amount must be a number"),
  body("estimatedDeliveryTime").optional().trim(),
  body("pincode").notEmpty().trim().withMessage("Pincode is required"),
  body("city").notEmpty().trim().withMessage("City is required"),
  body("state").notEmpty().trim().withMessage("State is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    try {
      const {
        name,
        description,
        centerLocation,
        deliveryRadius,
        isActive,
        deliveryFee,
        minimumOrderAmount,
        estimatedDeliveryTime,
        pincode,
        city,
        state,
      } = req.body;

      let geometry = null;
      if (centerLocation && deliveryRadius) {
        const points = [];
        const radius = deliveryRadius * 1000;
        const earthRadius = 6371000;

        for (let i = 0; i < 32; i++) {
          const angle = (((i * 360) / 32) * Math.PI) / 180;
          const lat = centerLocation.lat + (radius / earthRadius) * (180 / Math.PI) * Math.cos(angle);
          const lng =
            centerLocation.lng +
            ((radius / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
              Math.cos((centerLocation.lat * Math.PI) / 180);
          points.push([lng, lat]);
        }
        points.push(points[0]);

        geometry = {
          type: "Polygon",
          coordinates: [points],
        };
      }

      const serviceArea = new ServiceArea({
        name: name || `${city}, ${state}`,
        description,
        geometry,
        active: isActive !== undefined ? isActive : true,
        deliveryFee: deliveryFee || 0,
        minOrderAmount: minimumOrderAmount || 0,
        estimatedDeliveryTime: estimatedDeliveryTime || "30-45 minutes",
        centerLocation,
        deliveryRadius: deliveryRadius || 0.1,
        pincode,
        city,
        state,
        createdBy: req.user.id,
      });

      await serviceArea.save();
      res.status(201).json({ message: "Service area created successfully", serviceArea });
    } catch (error) {
      console.error("Create service area error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Update a service area by ID (admin only)
const updateServiceArea = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  body("name").optional().notEmpty().trim().withMessage("Name cannot be empty"),
  body("description").optional().trim(),
  body("centerLocation").optional().isObject().withMessage("Center location must be an object"),
  body("centerLocation.lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("centerLocation.lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("deliveryRadius").optional().isNumeric().custom((value) => value >= 0.1).withMessage("Delivery radius must be at least 0.1 km"),
  body("isActive").optional().isBoolean().withMessage("Active must be a boolean"),
  body("deliveryFee").optional().isNumeric().withMessage("Delivery fee must be a number"),
  body("minimumOrderAmount").optional().isNumeric().withMessage("Minimum order amount must be a number"),
  body("estimatedDeliveryTime").optional().trim(),
  body("pincode").optional().notEmpty().trim().withMessage("Pincode cannot be empty"),
  body("city").optional().notEmpty().trim().withMessage("City cannot be empty"),
  body("state").optional().notEmpty().trim().withMessage("State cannot be empty"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    try {
      const {
        name,
        description,
        centerLocation,
        deliveryRadius,
        isActive,
        deliveryFee,
        minimumOrderAmount,
        estimatedDeliveryTime,
        pincode,
        city,
        state,
      } = req.body;

      const serviceArea = await ServiceArea.findById(req.params.id);
      if (!serviceArea) {
        return res.status(404).json({ message: "Service area not found" });
      }

      if (name) serviceArea.name = name;
      if (description !== undefined) serviceArea.description = description;
      if (centerLocation) serviceArea.centerLocation = centerLocation;
      if (deliveryRadius) {
        serviceArea.deliveryRadius = deliveryRadius;
        if (centerLocation || deliveryRadius) {
          const points = [];
          const radius = deliveryRadius * 1000;
          const earthRadius = 6371000;
          const lat = centerLocation ? centerLocation.lat : serviceArea.centerLocation.lat;
          const lng = centerLocation ? centerLocation.lng : serviceArea.centerLocation.lng;

          for (let i = 0; i < 32; i++) {
            const angle = (((i * 360) / 32) * Math.PI) / 180;
            const newLat = lat + (radius / earthRadius) * (180 / Math.PI) * Math.cos(angle);
            const newLng =
              lng +
              ((radius / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
                Math.cos((lat * Math.PI) / 180);
            points.push([newLng, newLat]);
          }
          points.push(points[0]);

          serviceArea.geometry = {
            type: "Polygon",
            coordinates: [points],
          };
        }
      }
      if (isActive !== undefined) serviceArea.active = isActive;
      if (deliveryFee !== undefined) serviceArea.deliveryFee = deliveryFee;
      if (minimumOrderAmount !== undefined) serviceArea.minOrderAmount = minimumOrderAmount;
      if (estimatedDeliveryTime !== undefined) serviceArea.estimatedDeliveryTime = estimatedDeliveryTime;
      if (pincode) serviceArea.pincode = pincode;
      if (city) serviceArea.city = city;
      if (state) serviceArea.state = state;

      serviceArea.updatedBy = req.user.id;
      serviceArea.updatedAt = Date.now();

      await serviceArea.save();
      res.json({ message: "Service area updated successfully", serviceArea });
    } catch (error) {
      console.error("Update service area error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Delete a service area by ID (admin only)
const deleteServiceArea = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized: Admin access required" });
    }

    try {
      const serviceArea = await ServiceArea.findById(req.params.id);
      if (!serviceArea) {
        return res.status(404).json({ message: "Service area not found" });
      }

      await ServiceArea.deleteOne({ _id: req.params.id });
      res.json({ message: "Service area deleted successfully" });
    } catch (error) {
      console.error("Delete service area error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Check if a location is within any service area
const checkLocationInServiceArea = [
  body("location").notEmpty().withMessage("Location is required"),
  body("location.lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("location.lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { location } = req.body;

    try {
      const serviceAreasCount = await ServiceArea.countDocuments();

      if (serviceAreasCount === 0) {
        return res.json({
          isValid: true,
          message: "No service areas defined yet, all locations allowed",
          serviceArea: null,
        });
      }

      const point = {
        type: "Point",
        coordinates: [location.lng, location.lat],
      };

      const matchingArea = await ServiceArea.findOne({
        geometry: {
          $geoIntersects: {
            $geometry: point,
          },
        },
        active: true,
      });

      if (matchingArea) {
        res.json({
          isValid: true,
          message: `Location is within service area: ${matchingArea.name}`,
          serviceArea: {
            id: matchingArea._id,
            name: matchingArea.name,
            deliveryFee: matchingArea.deliveryFee,
            minOrderAmount: matchingArea.minOrderAmount,
            estimatedDeliveryTime: matchingArea.estimatedDeliveryTime,
          },
        });
      } else {
        res.json({
          isValid: false,
          message: "Location is outside our service areas",
          error: "SERVICE_AREA_ERROR",
        });
      }
    } catch (error) {
      console.error("Check location error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Get all active service areas (public)
const getActiveServiceAreas = async (req, res) => {
  try {
    const serviceAreas = await ServiceArea.find({ active: true });
    res.json(serviceAreas);
  } catch (error) {
    console.error("Get active service areas error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// New endpoints for frontend

// Get service areas with limit and active filter
const getServiceAreas = [
  query("limit").optional().isInt({ min: 1 }).withMessage("Limit must be a positive integer"),
  query("active").optional().isBoolean().withMessage("Active must be a boolean"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { limit, active } = req.query;
      let query = {};
      if (active !== undefined) {
        query.active = active === "true";
      }
      const serviceAreas = await ServiceArea.find(query)
        .limit(parseInt(limit) || 100)
        .select("name city state pincode centerLocation deliveryRadius deliveryFee estimatedDeliveryTime active");
      res.json({ serviceAreas });
    } catch (error) {
      console.error("Get service areas error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Check if a pincode is serviceable
const checkPincode = [
  param("pincode").notEmpty().trim().matches(/^\d{5,6}$/).withMessage("Pincode must be 5 or 6 digits"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { pincode } = req.params;
      const serviceArea = await ServiceArea.findOne({ pincode, active: true });
      if (!serviceArea) {
        return res.json({
          available: false,
          message: "Sorry, we don't deliver to this pincode yet",
        });
      }
      res.json({
        available: true,
        serviceArea: {
          id: serviceArea._id,
          name: serviceArea.name,
          city: serviceArea.city,
          state: serviceArea.state,
          pincode: serviceArea.pincode,
          centerLocation: serviceArea.centerLocation,
          deliveryRadius: serviceArea.deliveryRadius,
          deliveryFee: serviceArea.deliveryFee,
          estimatedDeliveryTime: serviceArea.estimatedDeliveryTime,
        },
      });
    } catch (error) {
      console.error("Check pincode error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Get nearby service areas based on coordinates
const getNearbyServiceAreas = [
  query("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  query("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  query("maxDistance").optional().isFloat({ min: 0 }).withMessage("Max distance must be a positive number"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const { lat, lng, maxDistance } = req.query;
      const maxDistanceMeters = (parseFloat(maxDistance) || 50) * 1000;

      const nearbyServiceAreas = await ServiceArea.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(lng), parseFloat(lat)],
            },
            distanceField: "distance",
            maxDistance: maxDistanceMeters,
            spherical: true,
            query: { active: true },
          },
        },
        {
          $project: {
            name: 1,
            city: 1,
            state: 1,
            pincode: 1,
            centerLocation: 1,
            deliveryRadius: 1,
            deliveryFee: 1,
            estimatedDeliveryTime: 1,
            distance: { $divide: ["$distance", 1000] },
          },
        },
        {
          $sort: { distance: 1 },
        },
      ]);

      res.json({ nearbyServiceAreas });
    } catch (error) {
      console.error("Get nearby service areas error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

module.exports = {
  getAllServiceAreas,
  getServiceAreaById,
  getServiceAreaByPincode,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
  checkLocationInServiceArea,
  getActiveServiceAreas,
  getServiceAreas,
  checkPincode,
  getNearbyServiceAreas,
};