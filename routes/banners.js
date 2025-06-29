const express = require("express")
const router = express.Router()
const bannerController = require("../controllers/bannerController")
const authenticate = require('../middleware/authenticate');

// Public routes
router.get("/", bannerController.getBannerImages)
router.get("/:id", bannerController.getBannerImage)

console.log("authenticate type:", typeof authenticate);

// Admin routes
router.use(authenticate)

router.post("/", bannerController.uploadBannerImage, bannerController.createBannerImage)

router.put("/:id", bannerController.uploadBannerImage, bannerController.updateBannerImage)

router.delete("/:id", bannerController.deleteBannerImage)

router.post("/reorder", bannerController.reorderBannerImages)

module.exports = router
