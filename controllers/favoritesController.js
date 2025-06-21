const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Favorites = require('../models/Favorites');
const Product = require('../models/Product');

const addToFavorites = [
  body('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productId } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: productId }).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      let favorites = await Favorites.findOne({ userId }).session(session);
      if (!favorites) {
        favorites = new Favorites({
          userId,
          products: [],
        });
      }

      const isAlreadyFavorite = favorites.products.some(item => item.productId === productId);
      if (isAlreadyFavorite) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Product already in favorites' });
      }

      favorites.products.push({ productId });
      await favorites.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: 'Product added to favorites', favorites });
    } catch (error) {
      await session.abortTransaction();
      console.error('Add to favorites error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const removeFromFavorites = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const productId = parseInt(req.params.productId);
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const favorites = await Favorites.findOne({ userId }).session(session);
      if (!favorites) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Favorites list not found' });
      }

      const productIndex = favorites.products.findIndex(item => item.productId === productId);
      if (productIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found in favorites' });
      }

      favorites.products.splice(productIndex, 1);
      await favorites.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: 'Product removed from favorites', favorites });
    } catch (error) {
      await session.abortTransaction();
      console.error('Remove from favorites error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorites.findOne({ userId: req.user.id });
    if (!favorites || favorites.products.length === 0) {
      return res.status(200).json({ message: 'Favorites list is empty', products: [] });
    }

    // Fetch product details for each favorite product
    const productIds = favorites.products.map(item => item.productId);
    const products = await Product.find({ globalId: { $in: productIds } }).lean();

    // Map products to ensure order matches favorites list
    const favoriteProducts = favorites.products
      .map(item => {
        const product = products.find(p => p.globalId === item.productId);
        return product ? { ...product, id: product.globalId } : null;
      })
      .filter(product => product !== null);

    res.json({ products: favoriteProducts });
  } catch (error) {
    console.error('Get favorites error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const clearFavorites = async (req, res) => {
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const favorites = await Favorites.findOne({ userId }).session(session);
    if (!favorites) {
      await session.commitTransaction();
      return res.status(200).json({ message: 'Favorites list is already empty' });
    }

    favorites.products = [];
    await favorites.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Favorites cleared successfully', favorites });
  } catch (error) {
    await session.abortTransaction();
    console.error('Clear favorites error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { addToFavorites, removeFromFavorites, getFavorites, clearFavorites };