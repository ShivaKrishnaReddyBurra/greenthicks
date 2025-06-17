const express = require("express")
const {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  clearFavorites,
} = require("../controllers/favoritesController")
const authenticate = require("../middleware/authenticate")

const router = express.Router()

router.post("/", authenticate, addToFavorites)
router.get("/", authenticate, getFavorites)
router.delete("/:productId", authenticate, removeFromFavorites)
router.delete("/", authenticate, clearFavorites)

module.exports = router
