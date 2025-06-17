const Favorites = require("../models/Favorites")
const Product = require("../models/Product")

const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body
    const userId = req.user.id

    // Check if product exists
    const product = await Product.findOne({ globalId: productId })
    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if already in favorites
    let favorites = await Favorites.findOne({ userId })
    if (!favorites) {
      favorites = new Favorites({ userId, products: [] })
    }

    if (favorites.products.includes(productId)) {
      return res.status(400).json({ message: "Product already in favorites" })
    }

    favorites.products.push(productId)
    await favorites.save()

    res.status(201).json({ message: "Product added to favorites" })
  } catch (error) {
    console.error("Add to favorites error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const removeFromFavorites = async (req, res) => {
  try {
    const productId = Number.parseInt(req.params.productId)
    const userId = req.user.id

    const favorites = await Favorites.findOne({ userId })
    if (!favorites) {
      return res.status(404).json({ message: "Favorites not found" })
    }

    favorites.products = favorites.products.filter((id) => id !== productId)
    await favorites.save()

    res.json({ message: "Product removed from favorites" })
  } catch (error) {
    console.error("Remove from favorites error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id

    const favorites = await Favorites.findOne({ userId })
    if (!favorites) {
      return res.json({ products: [] })
    }

    // Get full product details for favorites
    const products = await Product.find({
      globalId: { $in: favorites.products },
      published: true,
    })

    res.json({ products })
  } catch (error) {
    console.error("Get favorites error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

const clearFavorites = async (req, res) => {
  try {
    const userId = req.user.id

    await Favorites.findOneAndUpdate({ userId }, { products: [] }, { upsert: true })

    res.json({ message: "Favorites cleared successfully" })
  } catch (error) {
    console.error("Clear favorites error:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

module.exports = {
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  clearFavorites,
}
