const { body, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const path = require('path');

// Initialize Azure Blob Storage client
const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_CONTAINER_NAME);

// Configure multer for memory storage
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
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
}).array('images', 6);

// Configure multer for review images
const reviewImageUpload = multer({
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
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
}).array('reviewImages', 4); // Allow up to 4 review images

// Helper function to upload a file to Azure Blob Storage
const uploadToAzure = async (file) => {
  const blobName = `${Date.now()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.upload(file.buffer, file.buffer.length, {
    blobHTTPHeaders: { blobContentType: file.mimetype },
  });
  return blockBlobClient.url;
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

// Get all products
const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ globalId: 1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single product by globalId
const getProduct = [
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) })
        .populate('reviews.customer', 'name');
      if (!product) return res.status(404).json({ message: 'Product not found' });
      res.json(product);
    } catch (error) {
      console.error('Get product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

// Create a new product
const createProduct = [
  // Authentication middleware
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  // Multer middleware to handle file uploads
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
  // Validation middleware
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price')
    .trim()
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['leafy', 'fruit', 'root', 'herbs', 'milk', 'pulses', 'grains', 'spices', 'nuts', 'oils', 'snacks', 'beverages'])
    .withMessage('Invalid category'),
  body('unit').trim().notEmpty().withMessage('Unit is required'),
  body('stock')
    .trim()
    .notEmpty()
    .withMessage('Stock is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('originalPrice')
    .optional()
    .trim()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('discount')
    .optional()
    .trim()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Featured must be a boolean'),
  body('bestseller')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Bestseller must be a boolean'),
  body('seasonal')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Seasonal must be a boolean'),
  body('new')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('New must be a boolean'),
  body('organic')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Organic must be a boolean'),
  body('sku')
    .optional()
    .trim()
    .isString()
    .withMessage('SKU must be a string'),
  body('published')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Published must be a boolean'),
  body('nutrition')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') JSON.parse(value);
        return true;
      } catch {
        throw new Error('Nutrition must be a valid JSON object');
      }
    }),
  body('policies')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') JSON.parse(value);
        return true;
      } catch {
        throw new Error('Policies must be a valid JSON object');
      }
    }),
  body('tags')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error('Tags must be a valid JSON array');
      }
    }),
  body('imageData')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error('Image data must be a valid JSON array');
      }
    }),
  // Handler
  async (req, res) => {
    // Log incoming data for debugging
    console.log('Incoming req.body:', req.body);
    console.log('Incoming req.files:', req.files ? req.files.map(f => f.originalname) : []);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    // Check for at least one image
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get next globalId
      const counter = await Counter.findOneAndUpdate(
        { name: 'productId' },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );

      // Upload images to Azure
      const imageUploadPromises = req.files.map(file => uploadToAzure(file));
      const imageUrls = await Promise.all(imageUploadPromises);

      // Parse imageData
      let imageData = [];
      if (req.body.imageData) {
        try {
          imageData = typeof req.body.imageData === 'string' ? JSON.parse(req.body.imageData) : req.body.imageData;
          if (!Array.isArray(imageData)) imageData = [];
        } catch {
          imageData = [];
        }
      }

      // Map images with primary flags
      const images = imageUrls.map((url, index) => ({
        url,
        primary: imageData[index]?.primary === true || (index === 0 && imageData.length === 0),
      }));

      // Parse other JSON fields
      let nutrition = {};
      if (req.body.nutrition) {
        try {
          nutrition = typeof req.body.nutrition === 'string' ? JSON.parse(req.body.nutrition) : req.body.nutrition;
        } catch {
          nutrition = {};
        }
      }

      let policies = {};
      if (req.body.policies) {
        try {
          policies = typeof req.body.policies === 'string' ? JSON.parse(req.body.policies) : req.body.policies;
        } catch {
          policies = {};
        }
      }

      let tags = [];
      if (req.body.tags) {
        try {
          tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
          if (!Array.isArray(tags)) tags = [];
        } catch {
          tags = [];
        }
      }

      // Create product
      const product = new Product({
        globalId: counter.sequence,
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        price: parseFloat(req.body.price),
        originalPrice: req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined,
        category: req.body.category,
        unit: req.body.unit.trim(),
        stock: parseInt(req.body.stock),
        discount: req.body.discount ? parseInt(req.body.discount) : undefined,
        featured: req.body.featured === 'true',
        bestseller: req.body.bestseller === 'true',
        seasonal: req.body.seasonal === 'true',
        new: req.body.new === 'true',
        organic: req.body.organic === 'true',
        sku: req.body.sku ? req.body.sku.trim() : `PROD-${counter.sequence}`,
        published: req.body.published === 'true',
        nutrition,
        policies,
        tags,
        images,
      });

      await product.save({ session });
      await session.commitTransaction();
      res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error('Create product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Update an existing product
const updateProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
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
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price')
    .optional()
    .trim()
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('originalPrice')
    .optional()
    .trim()
    .isFloat({ min: 0 })
    .withMessage('Original price must be a positive number'),
  body('category')
    .optional()
    .isIn(['leafy', 'fruit', 'root', 'herbs', 'milk', 'pulses', 'grains', 'spices', 'nuts', 'oils', 'snacks', 'beverages'])
    .withMessage('Invalid category'),
  body('unit').optional().trim().notEmpty().withMessage('Unit cannot be empty'),
  body('stock')
    .optional()
    .trim()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('discount')
    .optional()
    .trim()
    .isInt({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  body('featured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Featured must be a boolean'),
  body('bestseller')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Bestseller must be a boolean'),
  body('seasonal')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Seasonal must be a boolean'),
  body('new')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('New must be a boolean'),
  body('organic')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Organic must be a boolean'),
  body('sku')
    .optional()
    .trim()
    .isString()
    .withMessage('SKU must be a string'),
  body('published')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Published must be a boolean'),
  body('nutrition')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') JSON.parse(value);
        return true;
      } catch {
        throw new Error('Nutrition must be a valid JSON object');
      }
    }),
  body('policies')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') JSON.parse(value);
        return true;
      } catch {
        throw new Error('Policies must be a valid JSON object');
      }
    }),
  body('tags')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error('Tags must be a valid JSON array');
      }
    }),
  body('imageData')
    .optional()
    .custom((value) => {
      try {
        if (typeof value === 'string') {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error('Image data must be a valid JSON array');
      }
    }),
  body('keepExistingImages')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('keepExistingImages must be a boolean'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      const oldImageUrls = req.body.keepExistingImages === 'false' ? product.images.map(img => img.url) : [];

      // Update fields if provided
      if (req.body.name) product.name = req.body.name.trim();
      if (req.body.description) product.description = req.body.description.trim();
      if (req.body.price) product.price = parseFloat(req.body.price);
      if (req.body.originalPrice !== undefined) product.originalPrice = req.body.originalPrice ? parseFloat(req.body.originalPrice) : undefined;
      if (req.body.category) product.category = req.body.category;
      if (req.body.unit) product.unit = req.body.unit.trim();
      if (req.body.stock !== undefined) product.stock = parseInt(req.body.stock);
      if (req.body.discount !== undefined) product.discount = req.body.discount ? parseInt(req.body.discount) : undefined;
      if (req.body.featured !== undefined) product.featured = req.body.featured === 'true';
      if (req.body.bestseller !== undefined) product.bestseller = req.body.bestseller === 'true';
      if (req.body.seasonal !== undefined) product.seasonal = req.body.seasonal === 'true';
      if (req.body.new !== undefined) product.new = req.body.new === 'true';
      if (req.body.organic !== undefined) product.organic = req.body.organic === 'true';
      if (req.body.sku) product.sku = req.body.sku.trim();
      if (req.body.published !== undefined) product.published = req.body.published === 'true';

      // Parse JSON fields
      if (req.body.nutrition) {
        product.nutrition = typeof req.body.nutrition === 'string' ? JSON.parse(req.body.nutrition) : req.body.nutrition;
      }
      if (req.body.policies) {
        product.policies = typeof req.body.policies === 'string' ? JSON.parse(req.body.policies) : req.body.policies;
      }
      if (req.body.tags) {
        product.tags = typeof req.body.tags === 'string' ? JSON.parse(req.body.tags) : req.body.tags;
      }

      // Handle images
      if (req.files && req.files.length > 0) {
        const imageUploadPromises = req.files.map(file => uploadToAzure(file));
        const imageUrls = await Promise.all(imageUploadPromises);
        let imageData = [];
        if (req.body.imageData) {
          try {
            imageData = typeof req.body.imageData === 'string' ? JSON.parse(req.body.imageData) : req.body.imageData;
          } catch {
            imageData = [];
          }
        }
        const newImages = imageUrls.map((url, index) => ({
          url,
          primary: imageData[index]?.primary === true,
        }));

        if (req.body.keepExistingImages === 'false') {
          product.images = newImages;
        } else {
          product.images = [...product.images, ...newImages];
        }
      }

      product.updatedAt = new Date();
      await product.save({ session });

      if (oldImageUrls.length > 0) {
        await deleteFromAzure(oldImageUrls);
      }

      await session.commitTransaction();
      res.json({ message: 'Product updated successfully', product });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error('Update product error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Delete a product
const deleteProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.images.length > 0) {
        const imageUrls = product.images.map(img => img.url);
        await deleteFromAzure(imageUrls);
      }

      if (product.reviews.length > 0) {
        const reviewImageUrls = product.reviews.flatMap(review => review.images || []);
        if (reviewImageUrls.length > 0) await deleteFromAzure(reviewImageUrls);
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

// Set primary image
const setPrimaryImage = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  body('imageUrl').trim().notEmpty().withMessage('Image URL is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const imageIndex = product.images.findIndex(img => img.url === req.body.imageUrl);
      if (imageIndex === -1) return res.status(404).json({ message: 'Image not found' });

      product.images.forEach(img => (img.primary = false));
      product.images[imageIndex].primary = true;

      await product.save();
      res.json({ message: 'Primary image set successfully', product });
    } catch (error) {
      console.error('Set primary image error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

// Delete an image
const deleteImage = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  body('imageUrl').trim().notEmpty().withMessage('Image URL is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      const imageIndex = product.images.findIndex(img => img.url === req.body.imageUrl);
      if (imageIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Image not found' });
      }

      await deleteFromAzure([req.body.imageUrl]);
      product.images.splice(imageIndex, 1);

      await product.save({ session });
      await session.commitTransaction();
      res.json({ message: 'Image deleted successfully', product });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete image error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Add a product review
const addProductReview = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    next();
  },
  (req, res, next) => {
    reviewImageUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      } else if (err) {
        return res.status(400).json({ message: 'File upload error', error: err.message });
      }
      next();
    });
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  body('rating')
    .trim()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('review').trim().notEmpty().withMessage('Review text is required'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      const existingReview = product.reviews.find(review => review.customer.toString() === req.user._id.toString());
      if (existingReview) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'You have already reviewed this product' });
      }

      let imageUrls = [];
      if (req.files && req.files.length > 0) {
        const imageUploadPromises = req.files.map(file => uploadToAzure(file));
        imageUrls = await Promise.all(imageUploadPromises);
      }

      product.reviews.push({
        customer: req.user._id,
        rating: parseInt(req.body.rating),
        review: req.body.review.trim(),
        approved: false,
        verified: req.body.verified === 'true',
        images: imageUrls,
      });

      await product.save({ session });
      await session.commitTransaction();
      res.status(201).json({ message: 'Review added successfully', review: product.reviews[product.reviews.length - 1] });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map(file => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error('Add review error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Update review status (approve/reject)
const updateReviewStatus = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  param('reviewId').isMongoId().withMessage('Invalid reviewId'),
  body('status')
    .trim()
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be approved or rejected'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) });
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const review = product.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ message: 'Review not found' });

      review.approved = req.body.status === 'approved';
      await product.save();
      res.json({ message: `Review ${req.body.status} successfully`, review });
    } catch (error) {
      console.error('Update review status error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  },
];

// Delete a review
const deleteReview = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized: No token provided' });
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Unauthorized: Admin access required' });
    next();
  },
  param('globalId').isInt({ min: 1 }).withMessage('Invalid globalId'),
  param('reviewId').isMongoId().withMessage('Invalid reviewId'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => err.msg).join('; ');
      return res.status(400).json({ message: 'Validation error', errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Product not found' });
      }

      const review = product.reviews.id(req.params.reviewId);
      if (!review) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Review not found' });
      }

      if (review.images && review.images.length > 0) {
        await deleteFromAzure(review.images);
      }

      product.reviews.pull(req.params.reviewId);
      await product.save({ session });
      await session.commitTransaction();
      res.json({ message: 'Review deleted successfully' });
    } catch (error) {
      await session.abortTransaction();
      console.error('Delete review error:', error.message);
      res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
      session.endSession();
    }
  },
];

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  setPrimaryImage,
  deleteImage,
  addProductReview,
  updateReviewStatus,
  deleteReview,
};