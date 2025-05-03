const { body, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path');

// Configure Azure Blob Storage
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

// Configure multer for memory storage (we'll upload to Azure Blob Storage directly)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG files are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
}).array('images', 5); // Allow up to 5 images

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ globalId: 1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProduct = [
  param('globalId').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) });
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

// Helper function to upload a file to Azure Blob Storage
const uploadToAzure = async (file) => {
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(file.buffer, file.buffer.length, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });

  return blockBlobClient.url; // Return the Blob URL
};

// Helper function to delete files from Azure Blob Storage
const deleteFromAzure = async (urls) => {
  const deletePromises = urls.map(async (url) => {
    const blobName = url.split('/').pop();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  });

  await Promise.all(deletePromises);
};

const createProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Handle file upload
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      } else if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'At least one image is required' });
      }
      next();
    });
  },
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('originalPrice').optional().isFloat({ min: 0 }),
  body('category').isIn(['leafy', 'fruit', 'root', 'herbs']),
  body('unit').notEmpty().trim(),
  body('stock').isInt({ min: 0 }),
  body('discount').optional().isInt({ min: 0, max: 100 }),
  body('featured').optional().isBoolean(),
  body('bestseller').optional().isBoolean(),
  body('seasonal').optional().isBoolean(),
  body('new').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Increment counter within transaction
      const counter = await Counter.findOneAndUpdate(
        { name: 'productId' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );

      // Upload images to Azure Blob Storage
      const imageUploadPromises = req.files.map(file => uploadToAzure(file));
      const imageUrls = await Promise.all(imageUploadPromises);

      // Create product
      const product = new Product({
        globalId: counter.sequence,
        name: req.body.name,
        description: req.body.description,
        price: req.body.price,
        originalPrice: req.body.originalPrice,
        category: req.body.category,
        unit: req.body.unit,
        stock: req.body.stock,
        discount: req.body.discount || 0,
        featured: req.body.featured === 'true',
        bestseller: req.body.bestseller === 'true',
        seasonal: req.body.seasonal === 'true',
        new: req.body.new === 'true',
        images: imageUrls,
      });

      await product.save({ session });

      // Commit transaction
      await session.commitTransaction();
      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      // Rollback transaction
      await session.abortTransaction();

      // Clean up uploaded images if product creation fails
      if (req.files) {
        const imageUrls = req.files.map(file => {
          const blobName = `${Date.now()}-${file.originalname}`;
          return `${containerClient.url}/${blobName}`;
        }).filter(url => url);

        if (imageUrls.length > 0) {
          await deleteFromAzure(imageUrls);
        }
      }

      console.error('Create product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const updateProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Handle file upload (optional for updates)
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      } else if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  param('globalId').isInt({ min: 1 }),
  body('name').optional().notEmpty().trim(),
  body('description').optional().notEmpty().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('originalPrice').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['leafy', 'fruit', 'root', 'herbs']),
  body('unit').optional().notEmpty().trim(),
  body('stock').optional().isInt({ min: 0 }),
  body('discount').optional().isInt({ min: 0, max: 100 }),
  body('featured').optional().isBoolean(),
  body('bestseller').optional().isBoolean(),
  body('seasonal').optional().isBoolean(),
  body('new').optional().isBoolean(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      const oldImageUrls = [...product.images]; // Save old image URLs for cleanup

      const updates = req.body;
      if (updates.name) product.name = updates.name;
      if (updates.description) product.description = updates.description;
      if (updates.price) product.price = updates.price;
      if (updates.originalPrice !== undefined) product.originalPrice = updates.originalPrice;
      if (updates.category) product.category = updates.category;
      if (updates.unit) product.unit = updates.unit;
      if (updates.stock !== undefined) product.stock = updates.stock;
      if (updates.discount !== undefined) product.discount = updates.discount;
      if (updates.featured !== undefined) product.featured = updates.featured;
      if (updates.bestseller !== undefined) product.bestseller = updates.bestseller;
      if (updates.seasonal !== undefined) product.seasonal = updates.seasonal;
      if (updates.new !== undefined) product.new = updates.new;

      if (req.files && req.files.length > 0) {
        // Upload new images to Azure Blob Storage
        const imageUploadPromises = req.files.map(file => uploadToAzure(file));
        const imageUrls = await Promise.all(imageUploadPromises);
        product.images = imageUrls;

        // Delete old images from Azure Blob Storage
        if (oldImageUrls.length > 0) {
          await deleteFromAzure(oldImageUrls);
        }
      }

      product.updatedAt = new Date();
      await product.save({ session });

      await session.commitTransaction();
      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      await session.abortTransaction();

      // Clean up new images if update fails
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => {
          const blobName = `${Date.now()}-${file.originalname}`;
          return `${containerClient.url}/${blobName}`;
        }).filter(url => url);

        if (imageUrls.length > 0) {
          await deleteFromAzure(imageUrls);
        }
      }

      console.error('Update product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

const deleteProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      // Delete images from Azure Blob Storage
      if (product.images.length > 0) {
        await deleteFromAzure(product.images);
      }

      await Product.deleteOne({ globalId: parseInt(req.params.globalId) }, { session });

      await session.commitTransaction();
      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };