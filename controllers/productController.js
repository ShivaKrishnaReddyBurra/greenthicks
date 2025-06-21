const { body, param, validationResult } = require("express-validator");
const Product = require("../models/Product");
const Counter = require("../models/Counter");
const mongoose = require("mongoose");
const { BlobServiceClient } = require("@azure/storage-blob");
const multer = require("multer");
const path = require("path");

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
      cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
    }
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
}).array("images", 6);

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
      cb(new Error("Only JPEG, JPG, and PNG files are allowed!"));
    }
  },
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB limit
}).array("reviewImages", 4);

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
    const blobName = url.split("/").pop();
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
    console.error("Get products error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single product by globalId
const getProduct = [
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }).populate(
        "reviews.customer",
        "name"
      );
      if (!product) return res.status(404).json({ message: "Product not found" });
      res.json(product);
    } catch (error) {
      console.error("Get product error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Create a new product
const createProduct = [
  // Authentication middleware
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  // Multer middleware to handle file uploads
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      } else if (err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  // Validation middleware
  body("name").trim().notEmpty().withMessage("Product name is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("price")
    .trim()
    .notEmpty()
    .withMessage("Price is required")
    .isFloat({ min: 0.01 })
    .withMessage("Price must be a positive number"),
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn(["leafy", "fruit", "root", "herbs", "milk", "pulses", "grains", "spices", "nuts", "oils", "snacks", "beverages"])
    .withMessage("Invalid category"),
  body("unit").trim().notEmpty().withMessage("Unit is required"),
  body("stock")
    .trim()
    .notEmpty()
    .withMessage("Stock is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
  body("originalPrice").optional().trim().isFloat({ min: 0 }).withMessage("Original price must be a positive number"),
  body("discount").optional().trim().isInt({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),
  body("featured").optional().isIn(["true", "false"]).withMessage("Featured must be a boolean"),
  body("bestseller").optional().isIn(["true", "false"]).withMessage("Bestseller must be a boolean"),
  body("seasonal").optional().isIn(["true", "false"]).withMessage("Seasonal must be a boolean"),
  body("new").optional().isIn(["true", "false"]).withMessage("New must be a boolean"),
  body("organic").optional().isIn(["true", "false"]).withMessage("Organic must be a boolean"),
  body("sku").optional().trim().isString().withMessage("SKU must be a string"),
  body("published").optional().isIn(["true", "false"]).withMessage("Published must be a boolean"),
  body("nutrition")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") JSON.parse(value);
        return true;
      } catch {
        throw new Error("Nutrition must be a valid JSON object");
      }
    }),
  body("policies")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") JSON.parse(value);
        return true;
      } catch {
        throw new Error("Policies must be a valid JSON object");
      }
    }),
  body("tags")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error("Tags must be a valid JSON array");
      }
    }),
  body("imageData")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error("Image data must be a valid JSON array");
      }
    }),
  // Handler
  async (req, res) => {
    console.log("Incoming req.body:", req.body);
    console.log("Incoming req.files:", req.files ? req.files.map((f) => f.originalname) : []);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const counter = await Counter.findOneAndUpdate(
        { name: "productId" },
        { $inc: { sequence: 1 } },
        { new: true, upsert: true, session }
      );

      const imageUploadPromises = req.files.map((file) => uploadToAzure(file));
      const imageUrls = await Promise.all(imageUploadPromises);

      let imageData = [];
      if (req.body.imageData) {
        try {
          imageData = typeof req.body.imageData === "string" ? JSON.parse(req.body.imageData) : req.body.imageData;
          if (!Array.isArray(imageData)) imageData = [];
        } catch {
          imageData = [];
        }
      }

      const images = imageUrls.map((url, index) => ({
        url,
        primary: imageData[index]?.primary === true || (index === 0 && imageData.length === 0),
      }));

      let nutrition = {};
      if (req.body.nutrition) {
        try {
          nutrition = typeof req.body.nutrition === "string" ? JSON.parse(req.body.nutrition) : req.body.nutrition;
        } catch {
          nutrition = {};
        }
      }

      let policies = {};
      if (req.body.policies) {
        try {
          policies = typeof req.body.policies === "string" ? JSON.parse(req.body.policies) : req.body.policies;
        } catch {
          policies = {};
        }
      }

      let tags = [];
      if (req.body.tags) {
        try {
          tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
          if (!Array.isArray(tags)) tags = [];
        } catch {
          tags = [];
        }
      }

      const product = new Product({
        globalId: counter.sequence,
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        price: Number.parseFloat(req.body.price),
        originalPrice: req.body.originalPrice ? Number.parseFloat(req.body.originalPrice) : undefined,
        category: req.body.category,
        unit: req.body.unit.trim(),
        stock: Number.parseInt(req.body.stock),
        discount: req.body.discount ? Number.parseInt(req.body.discount) : undefined,
        featured: req.body.featured === "true",
        bestseller: req.body.bestseller === "true",
        seasonal: req.body.seasonal === "true",
        new: req.body.new === "true",
        organic: req.body.organic === "true",
        sku: req.body.sku ? req.body.sku.trim() : `PROD-${counter.sequence}`,
        published: req.body.published === "true",
        nutrition,
        policies,
        tags,
        images,
      });

      await product.save({ session });
      await session.commitTransaction();
      res.status(201).json({ message: "Product created successfully", product });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map((file) => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error("Create product error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Update an existing product
const updateProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      } else if (err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  body("name").optional().trim().notEmpty().withMessage("Product name cannot be empty"),
  body("description").optional().trim().notEmpty().withMessage("Description cannot be empty"),
  body("price").optional().trim().isFloat({ min: 0.01 }).withMessage("Price must be a positive number"),
  body("originalPrice").optional().trim().isFloat({ min: 0 }).withMessage("Original price must be a positive number"),
  body("category")
    .optional()
    .isIn(["leafy", "fruit", "root", "herbs", "milk", "pulses", "grains", "spices", "nuts", "oils", "snacks", "beverages"])
    .withMessage("Invalid category"),
  body("unit").optional().trim().notEmpty().withMessage("Unit cannot be empty"),
  body("stock").optional().trim().isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
  body("discount").optional().trim().isInt({ min: 0, max: 100 }).withMessage("Discount must be between 0 and 100"),
  body("featured").optional().isIn(["true", "false"]).withMessage("Featured must be a boolean"),
  body("bestseller").optional().isIn(["true", "false"]).withMessage("Bestseller must be a boolean"),
  body("seasonal").optional().isIn(["true", "false"]).withMessage("Seasonal must be a boolean"),
  body("new").optional().isIn(["true", "false"]).withMessage("New must be a boolean"),
  body("organic").optional().isIn(["true", "false"]).withMessage("Organic must be a boolean"),
  body("sku").optional().trim().isString().withMessage("SKU must be a string"),
  body("published").optional().isIn(["true", "false"]).withMessage("Published must be a boolean"),
  body("nutrition")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") JSON.parse(value);
        return true;
      } catch {
        throw new Error("Nutrition must be a valid JSON object");
      }
    }),
  body("policies")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") JSON.parse(value);
        return true;
      } catch {
        throw new Error("Policies must be a valid JSON object");
      }
    }),
  body("tags")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error("Tags must be a valid JSON array");
      }
    }),
  body("imageData")
    .optional()
    .custom((value) => {
      try {
        if (typeof value === "string") {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed)) throw new Error();
        }
        return true;
      } catch {
        throw new Error("Image data must be a valid JSON array");
      }
    }),
  body("keepExistingImages").optional().isIn(["true", "false"]).withMessage("keepExistingImages must be a boolean"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    console.log("Update request body:", req.body);
    console.log("Update request files:", req.files ? req.files.map((f) => f.originalname) : []);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product not found" });
      }

      // Log current reviews to debug
      console.log("Current product reviews:", product.reviews);

      const oldImageUrls = req.body.keepExistingImages === "false" ? product.images.map((img) => img.url) : [];

      // Build update object with only the fields that should be updated
      const updateData = {};

      if (req.body.name) updateData.name = req.body.name.trim();
      if (req.body.description) updateData.description = req.body.description.trim();
      if (req.body.price) updateData.price = Number.parseFloat(req.body.price);
      if (req.body.originalPrice !== undefined)
        updateData.originalPrice = req.body.originalPrice ? Number.parseFloat(req.body.originalPrice) : undefined;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.unit) updateData.unit = req.body.unit.trim();
      if (req.body.stock !== undefined) updateData.stock = Number.parseInt(req.body.stock);
      if (req.body.discount !== undefined)
        updateData.discount = req.body.discount ? Number.parseInt(req.body.discount) : undefined;
      if (req.body.featured !== undefined) updateData.featured = req.body.featured === "true";
      if (req.body.bestseller !== undefined) updateData.bestseller = req.body.bestseller === "true";
      if (req.body.seasonal !== undefined) updateData.seasonal = req.body.seasonal === "true";
      if (req.body.new !== undefined) updateData.new = req.body.new === "true";
      if (req.body.organic !== undefined) updateData.organic = req.body.organic === "true";
      if (req.body.sku) updateData.sku = req.body.sku.trim();
      if (req.body.published !== undefined) updateData.published = req.body.published === "true";

      if (req.body.nutrition) {
        updateData.nutrition = typeof req.body.nutrition === "string" ? JSON.parse(req.body.nutrition) : req.body.nutrition;
      }
      if (req.body.policies) {
        updateData.policies = typeof req.body.policies === "string" ? JSON.parse(req.body.policies) : req.body.policies;
      }
      if (req.body.tags) {
        updateData.tags = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;
      }

      if (req.files && req.files.length > 0) {
        const imageUploadPromises = req.files.map((file) => uploadToAzure(file));
        const imageUrls = await Promise.all(imageUploadPromises);
        let imageData = [];
        if (req.body.imageData) {
          try {
            imageData = typeof req.body.imageData === "string" ? JSON.parse(req.body.imageData) : req.body.imageData;
          } catch {
            imageData = [];
          }
        }
        const newImages = imageUrls.map((url, index) => ({
          url,
          primary: imageData[index]?.primary === true,
        }));

        if (req.body.keepExistingImages === "false") {
          updateData.images = newImages;
        } else {
          updateData.images = [...product.images, ...newImages];
        }
      }

      updateData.updatedAt = new Date();

      // Log the update data to ensure reviews are not included
      console.log("Update data:", updateData);

      // Perform the update with strict exclusion of reviews
      await Product.updateOne(
        { globalId: Number.parseInt(req.params.globalId) },
        { $set: updateData },
        { session, validateModifiedOnly: true } // Validate only modified fields
      );

      if (oldImageUrls.length > 0) {
        await deleteFromAzure(oldImageUrls);
      }

      // Fetch the updated product to return
      const updatedProduct = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }, null, { session });

      await session.commitTransaction();
      res.json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map((file) => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error("Update product error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Delete a product
const deleteProduct = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.images.length > 0) {
        const imageUrls = product.images.map((img) => img.url);
        await deleteFromAzure(imageUrls);
      }

      if (product.reviews.length > 0) {
        const reviewImageUrls = product.reviews.flatMap((review) => review.images || []);
        if (reviewImageUrls.length > 0) await deleteFromAzure(reviewImageUrls);
      }

      await Product.deleteOne({ globalId: Number.parseInt(req.params.globalId) }, { session });
      await session.commitTransaction();
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Delete product error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Set primary image
const setPrimaryImage = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  body("imageUrl").trim().notEmpty().withMessage("Image URL is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const imageIndex = product.images.findIndex((img) => img.url === req.body.imageUrl);
      if (imageIndex === -1) return res.status(404).json({ message: "Image not found" });

      product.images.forEach((img) => (img.primary = false));
      product.images[imageIndex].primary = true;

      await product.save();
      res.json({ message: "Primary image set successfully", product });
    } catch (error) {
      console.error("Set primary image error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Delete an image
const deleteImage = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  body("imageUrl").trim().notEmpty().withMessage("Image URL is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product not found" });
      }

      const imageIndex = product.images.findIndex((img) => img.url === req.body.imageUrl);
      if (imageIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Image not found" });
      }

      await deleteFromAzure([req.body.imageUrl]);
      product.images.splice(imageIndex, 1);

      await product.save({ session });
      await session.commitTransaction();
      res.json({ message: "Image deleted successfully", product });
    } catch (error) {
      await session.abortTransaction();
      console.error("Delete image error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Add a product review
const User = require("../models/User");

const addProductReview = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: User not authenticated" });
    next();
  },
  (req, res, next) => {
    reviewImageUpload(req, res, (err) => {
      if (err instanceof multer.MulterError || err) {
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      next();
    });
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  body("rating").notEmpty().isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("review").trim().notEmpty().withMessage("Review text is required"),
  body("name").optional().trim().isString().withMessage("Name must be a string"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: Number(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product not found" });
      }

      const user = await User.findOne({ globalId: req.user.id });
      if (!user) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found" });
      }

      const existingReview = product.reviews.find((review) =>
        review.customer && review.customer.toString() === user._id.toString()
      );

      console.log("Checking orders for:");
      console.log("User ID:", user.globalId);
      console.log("Global ID (Product):", Number(req.params.globalId));

      const Order = require("../models/Order");
      const userOrders = await Order.find({
      userId: user.globalId, // Not user._id
      deliveryStatus: "delivered",
        });

        const isVerifiedBuyer = userOrders.some(order =>
          order.items.some(item =>
            String(item.productId) === String(req.params.globalId)
          )
        );

      let ReviewImagesUrls = [];
      if (req.files && req.files.length > 0) {
        const imageUploadPromises = req.files.map((file) => uploadToAzure(file));
        ReviewImagesUrls = await Promise.all(imageUploadPromises);
      }

      const newReview = {
        customer: user._id, // ✅ ObjectId from DB
        customerName: req.body.name || user.name || "Anonymous",
        rating: Number(req.body.rating),
        review: req.body.review.trim(),
        approved: isVerifiedBuyer,
        verified: isVerifiedBuyer,
        images: ReviewImagesUrls,
      };

      product.reviews.push(newReview);
      await product.save({ session });
      await session.commitTransaction();

      await product.populate("reviews.customer", "name");
      const addedReview = product.reviews[product.reviews.length - 1];

      res.status(201).json({
        message: isVerifiedBuyer
          ? "Review submitted and published successfully."
          : "Review submitted successfully. Your aren't a verified buyer So It will be published after moderation.",
        review: addedReview,
      });
    } catch (error) {
      await session.abortTransaction();
      if (req.files && req.files.length > 0) {
        const imageUrls = req.files.map((file) => `${containerClient.url}/${Date.now()}-${file.originalname}`);
        await deleteFromAzure(imageUrls);
      }
      console.error("Add review error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];


// Update review status (approve/reject)
const updateReviewStatus = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Forbidden: Admin access required" });
    next();
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  param("reviewId").isMongoId().withMessage("Invalid reviewId"),
  body("status").trim().isIn(["approved", "rejected"]).withMessage("Status must be approved or rejected"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    try {
      const product = await Product.findOne({ globalId: Number(req.params.globalId) });
      if (!product) return res.status(404).json({ message: "Product not found" });

      const review = product.reviews.id(req.params.reviewId);
      if (!review) return res.status(404).json({ message: "Review not found" });

      review.approved = req.body.status === "approved";
      await product.save();

      res.json({
        message: `Review ${req.body.status} successfully`,
        review,
      });
    } catch (error) {
      console.error("Update review status error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
];

// Delete a review
const deleteReview = [
  (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized: No token provided" });
    if (!req.user.isAdmin) return res.status(403).json({ message: "Unauthorized: Admin access required" });
    next();
  },
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  param("reviewId").isMongoId().withMessage("Invalid reviewId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map((err) => err.msg).join("; ");
      return res.status(400).json({ message: "Validation error", errors: errorMessages });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) }, null, { session });
      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Product not found" });
      }

      const review = product.reviews.id(req.params.reviewId);
      if (!review) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Review not found" });
      }

      if (review.images && review.images.length > 0) {
        await deleteFromAzure(review.images);
      }

      product.reviews.pull(req.params.reviewId);
      await product.save({ session });
      await session.commitTransaction();
      res.json({ message: "Review deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Delete review error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    } finally {
      session.endSession();
    }
  },
];

// Get reviews for a product
const getProductReviews = [
  param("globalId").isInt({ min: 1 }).withMessage("Invalid globalId"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const product = await Product.findOne({ globalId: Number.parseInt(req.params.globalId) })
        .populate("reviews.customer", "name")
        .select("reviews");

      if (!product) return res.status(404).json({ message: "Product not found" });

      const approvedReviews = product.reviews.filter((review) => review.approved);
      res.json({ reviews: approvedReviews });
    } catch (error) {
      console.error("Get product reviews error:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
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
  getProductReviews,
};