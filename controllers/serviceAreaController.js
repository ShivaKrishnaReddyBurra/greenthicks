const { body, param, query, validationResult } = require("express-validator")
const mongoose = require("mongoose")
const ServiceArea = require("../models/ServiceArea")

// Get all service areas (public)
const getAllServiceAreas = [
  query("limit").optional().isInt({ min: 1, max: 1000 }).withMessage("Limit must be between 1 and 1000"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("active").optional().isBoolean().withMessage("Active must be a boolean"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
      const { limit = 100, page = 1, active } = req.query
      const query = {}

      if (active !== undefined) {
        query.isActive = active === "true"
      }

      const serviceAreas = await ServiceArea.find(query)
        .limit(Number.parseInt(limit))
        .skip((Number.parseInt(page) - 1) * Number.parseInt(limit))
        .sort({ createdAt: -1 })
        .select("name city state pincode centerLocation deliveryRadius deliveryFee estimatedDeliveryTime isActive")
        .lean()

      const total = await ServiceArea.countDocuments(query)

      res.json({
        success: true,
        serviceAreas: serviceAreas.map(area => ({
          ...area,
          name: area.name || `${area.city}, ${area.state}`,
          centerLocation: area.centerLocation || { lat: 0, lng: 0 },
          deliveryRadius: area.deliveryRadius || 5,
          deliveryFee: area.deliveryFee || 0,
          estimatedDeliveryTime: area.estimatedDeliveryTime || "30-45 minutes",
        })),
        pagination: {
          total,
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil(total / Number.parseInt(limit)),
        },
      })
    } catch (error) {
      console.error("Get all service areas error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Check pincode availability (public)
const checkPincodeAvailability = [
  query("pincode").notEmpty().trim().matches(/^\d{5,6}$/).withMessage("Pincode must be 5 or 6 digits"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
      const { pincode } = req.query
      const serviceArea = await ServiceArea.findOne({ pincode, isActive: true })
        .select("name city state pincode centerLocation deliveryRadius deliveryFee estimatedDeliveryTime")
        .lean()

      if (serviceArea) {
        res.json({
          success: true,
          available: true,
          serviceArea: {
            id: serviceArea._id,
            name: serviceArea.name || `${serviceArea.city}, ${serviceArea.state}`,
            city: serviceArea.city,
            state: serviceArea.state,
            pincode: serviceArea.pincode,
            centerLocation: serviceArea.centerLocation || { lat: 0, lng: 0 },
            deliveryRadius: serviceArea.deliveryRadius || 5,
            deliveryFee: serviceArea.deliveryFee || 0,
            estimatedDeliveryTime: area.estimatedDeliveryTime || "30-45 minutes",
          },
        })
      } else {
        res.json({
          success: true,
          available: false,
          message: "Sorry, we don't deliver to this pincode yet. Contact us to request service in your area.",
        })
      }
    } catch (error) {
      console.error("Check pincode error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Get nearby service areas (public)
const getNearbyServiceAreas = [
  query("lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  query("lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  query("radius").optional().isFloat({ min: 0, max: 500 }).withMessage("Radius must be between 0 and 500 km"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
      const { lat, lng, radius = 50 } = req.query
      const maxDistanceMeters = Number.parseFloat(radius) * 1000

      const nearbyServiceAreas = await ServiceArea.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number.parseFloat(lng), Number.parseFloat(lat)],
            },
            distanceField: "distance",
            maxDistance: maxDistanceMeters,
            spherical: true,
            query: { isActive: true, centerLocation: { $exists: true } },
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
        {
          $limit: 10,
        },
      ])

      res.json({
        success: true,
        nearbyServiceAreas: nearbyServiceAreas.map(area => ({
          id: area._id,
          name: area.name || `${area.city}, ${area.state}`,
          city: area.city,
          state: area.state,
          pincode: area.pincode,
          centerLocation: area.centerLocation || { lat: 0, lng: 0 },
          deliveryRadius: area.deliveryRadius || 5,
          deliveryFee: area.deliveryFee || 0,
          estimatedDeliveryTime: area.estimatedDeliveryTime || "30-45 minutes",
          distance: Number.parseFloat(area.distance.toFixed(2)),
        })),
      })
    } catch (error) {
      console.error("Get nearby service areas error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Check if a location is within any service area (public)
const checkLocationInServiceArea = [
  body("location").notEmpty().withMessage("Location is required"),
  body("location.lat").isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("location.lng").isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    try {
      const { location } = req.body
      const latitude = Number.parseFloat(location.lat)
      const longitude = Number.parseFloat(location.lng)

      const serviceAreasCount = await ServiceArea.countDocuments({ isActive: true })

      if (serviceAreasCount === 0) {
        return res.json({
          success: true,
          isValid: true,
          message: "No service areas defined yet, all locations allowed",
          serviceArea: null,
          deliveryFee: 0,
        })
      }

      const point = {
        type: "Point",
        coordinates: [longitude, latitude],
      }

      const matchingArea = await ServiceArea.findOne({
        geometry: {
          $geoIntersects: {
            $geometry: point,
          },
        },
        isActive: true,
      }).lean()

      if (matchingArea) {
        res.json({
          success: true,
          isValid: true,
          message: `Location is within service area: ${matchingArea.city}, ${matchingArea.state}`,
          serviceArea: {
            id: matchingArea._id,
            name: matchingArea.name || `${matchingArea.city}, ${matchingArea.state}`,
            city: matchingArea.city,
            state: matchingArea.state,
            pincode: matchingArea.pincode,
            deliveryFee: matchingArea.deliveryFee || 0,
            minOrderAmount: matchingArea.minOrderAmount || 0,
            estimatedDeliveryTime: matchingArea.estimatedDeliveryTime || "30-45 minutes",
          },
        })
      } else {
        res.json({
          success: true,
          isValid: false,
          message: "Location is outside our service areas",
          error: "SERVICE_AREA_ERROR",
        })
      }
    } catch (error) {
      console.error("Check location error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Get a specific service area by ID (admin only)
const getServiceAreaById = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" })
    }

    try {
      const serviceArea = await ServiceArea.findById(req.params.id).lean()
      if (!serviceArea) {
        return res.status(404).json({ success: false, message: "Service area not found" })
      }
      res.json({ success: true, serviceArea })
    } catch (error) {
      console.error("Get service area error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Create a new service area (admin only)
const createServiceArea = [
  body("name").optional().trim(),
  body("description").optional().trim(),
  body("centerLocation").optional().isObject().withMessage("Center location must be an object"),
  body("centerLocation.lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("centerLocation.lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("deliveryRadius").optional().isNumeric().custom(value => value >= 0.1).withMessage("Delivery radius must be at least 0.1 km"),
  body("isActive").optional().isBoolean().withMessage("Active must be a boolean"),
  body("deliveryFee").optional().isNumeric().withMessage("Delivery fee must be a number"),
  body("minOrderAmount").optional().isNumeric().withMessage("Minimum order amount must be a number"),
  body("estimatedDeliveryTime").optional().trim(),
  body("pincode").notEmpty().trim().matches(/^\d{5,6}$/).withMessage("Pincode must be 5 or 6 digits"),
  body("city").notEmpty().trim().withMessage("City is required"),
  body("state").notEmpty().trim().withMessage("State is required"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" })
    }

    try {
      const {
        name,
        description,
        centerLocation,
        deliveryRadius,
        isActive,
        deliveryFee,
        minOrderAmount,
        estimatedDeliveryTime,
        pincode,
        city,
        state,
      } = req.body

      let geometry = null
      if (centerLocation && deliveryRadius) {
        const points = []
        const radiusMeters = deliveryRadius * 1000
        const earthRadius = 6371000

        for (let i = 0; i < 32; i++) {
          const angle = (((i * 360) / 32) * Math.PI) / 180
          const lat = centerLocation.lat + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(angle)
          const lng =
            centerLocation.lng +
            ((radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
              Math.cos((centerLocation.lat * Math.PI) / 180)
          points.push([lng, lat])
        }
        points.push(points[0])

        geometry = {
          type: "Polygon",
          coordinates: [points],
        }
      }

      const serviceArea = new ServiceArea({
        name: name || `${city}, ${state}`,
        description,
        geometry,
        isActive: isActive !== undefined ? isActive : true,
        deliveryFee: deliveryFee || 0,
        minOrderAmount: minOrderAmount || 0,
        estimatedDeliveryTime: estimatedDeliveryTime || "30-45 minutes",
        centerLocation: centerLocation || { lat: 0, lng: 0 },
        deliveryRadius: deliveryRadius || 0.2,
        pincode,
        city,
        state,
        createdBy: req.user.id || "admin",
      })

      await serviceArea.save()
      res.status(201).json({ success: true, message: "Service area created successfully", serviceArea })
    } catch (error) {
      console.error("Create service area error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Update a service area (admin only)
const updateServiceArea = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  body("name").optional().notEmpty().trim().withMessage("Name cannot be empty"),
  body("description").optional().trim(),
  body("centerLocation").optional().isObject().withMessage("Center location must be an object"),
  body("centerLocation.lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("centerLocation.lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
  body("isActive").optional().isBoolean().withMessage("Active must be a boolean"),
  body("deliveryFee").optional().isNumeric().withMessage("Delivery fee must be a number"),
  body("minOrderAmount").optional().isNumeric().withMessage("Minimum order amount must be a number"),
  body("estimatedDeliveryTime").optional().trim(),
  body("deliveryRadius").optional().isNumeric().custom(value => value >= 0.1).withMessage("Delivery radius must be at least 0.1 km"),
  body("city").optional().notEmpty().trim().withMessage("City cannot be empty"),
  body("state").optional().notEmpty().trim().withMessage("State cannot be empty"),
  body("pincode").optional().trim().matches(/^\d{5,6}$/).withMessage("Pincode must be 5 or 6 digits"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" })
    }

    try {
      const updateData = { ...req.body }
      if (updateData.centerLocation && updateData.deliveryRadius) {
        const points = []
        const radiusMeters = updateData.deliveryRadius * 1000
        const earthRadius = 6371000
        const lat = updateData.centerLocation.lat
        const lng = updateData.centerLocation.lng

        for (let i = 0; i < 32; i++) {
          const angle = (((i * 360) / 32) * Math.PI) / 180
          const newLat = lat + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(angle)
          const newLng =
            lng +
            ((radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(angle)) /
              Math.cos((lat * Math.PI) / 180)
          points.push([newLng, newLat])
        }
        points.push(points[0])

        updateData.geometry = {
          type: "Polygon",
          coordinates: [points],
        }
      }
      updateData.updatedBy = req.user.id || "admin"
      updateData.updatedAt = new Date()

      const serviceArea = await ServiceArea.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      }).lean()

      if (!serviceArea) {
        return res.status(404).json({ success: false, message: "Service area not found" })
      }

      res.json({ success: true, message: "Service area updated successfully", serviceArea })
    } catch (error) {
      console.error("Update service area error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

// Delete a service area (admin only)
const deleteServiceArea = [
  param("id").isMongoId().withMessage("Invalid service area ID"),
  async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() })

    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized: Admin access required" })
    }

    try {
      const serviceArea = await ServiceArea.findById(req.params.id)
      if (!serviceArea) {
        return res.status(404).json({ success: false, message: "Service area not found" })
      }

      await ServiceArea.deleteOne({ _id: req.params.id })
      res.json({ success: true, message: "Service area deleted successfully" })
    } catch (error) {
      console.error("Delete service area error:", error.message)
      res.status(500).json({ success: false, message: "Server error", error: error.message })
    }
  },
]

module.exports = {
  getAllServiceAreas,
  checkPincodeAvailability,
  getNearbyServiceAreas,
  checkLocationInServiceArea,
  getServiceAreaById,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
}