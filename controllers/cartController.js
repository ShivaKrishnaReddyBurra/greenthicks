const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const addToCart = [
  body('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { productId, quantity } = req.body;
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: productId }).session(session);
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }
      if (product.stock < quantity) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      let cart = await Cart.findOne({ userId }).session(session);
      if (!cart) {
        cart = new Cart({
          userId,
          items: [],
        });
      }

      const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
      if (existingItemIndex !== -1) {
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        cart.items.push({
          productId: product.globalId,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.find((img) => img.primary)?.url || '',
        });
      }

      await cart.save({ session });
      await session.commitTransaction();
      res.status(200).json({ message: 'Item added to cart', cart });
    } catch (error) {
      await session.abortTransaction();
      console.error('Add to cart error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const removeFromCart = [
  param('productId').isInt({ min: 1 }).withMessage('Invalid product ID'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const productId = parseInt(req.params.productId);
    const userId = req.user.id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const cart = await Cart.findOne({ userId }).session(session);
      if (!cart) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Cart not found' });
      }

      const itemIndex = cart.items.findIndex(item => item.productId === productId);
      if (itemIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Item not found in cart' });
      }

      cart.items.splice(itemIndex, 1);
      await cart.save({ session });

      await session.commitTransaction();
      res.status(200).json({ message: 'Item removed from cart', cart });
    } catch (error) {
      await session.abortTransaction();
      console.error('Remove from cart error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      return res.status(200).json({ message: 'Cart is empty', cart: { userId: req.user.id, items: [] } });
    }
    res.json(cart);
  } catch (error) {
    console.error('Get cart error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const clearCart = async (req, res) => {
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      await session.commitTransaction();
      return res.status(200).json({ message: 'Cart is already empty' });
    }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    res.status(200).json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    await session.abortTransaction();
    console.error('Clear cart error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { addToCart, removeFromCart, getCart, clearCart };