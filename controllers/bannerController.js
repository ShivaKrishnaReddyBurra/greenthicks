const mongoose = require("mongoose");
const BannerImage = require("../models/BannerImage");
const multer = require("multer");
const path = require("path");
const sharp = require("sharp");
const { BlobServiceClient } = require("@azure/storage-blob");
const { Readable } = require("stream");

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const BANNER_CONTAINER_NAME = "banner-images";

const uploadToAzure = async (buffer, filename, mimetype) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(BANNER_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(filename);
  const stream = Readable.from(buffer);
  await blockBlobClient.uploadStream(stream, buffer.length, undefined, {
    blobHTTPHeaders: { blobContentType: mimetype },
  });
  return blockBlobClient.url;
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get banner images by type
const getBannerImages = async (req, res) => {
  try {
    const { type = "desktop" } = req.query;
    const { admin } = req.query;

    let banners;
    if (admin === "true") {
      banners = await BannerImage.getAllByType(type);
    } else {
      banners = await BannerImage.getActiveByType(type);
    }

    // Use Azure URLs directly
    const bannersWithUrls = banners.map((banner) => ({
      ...banner.toObject(),
      imageUrl: banner.imageUrl, // Use the stored Azure URL
    }));

    res.json({
      success: true,
      images: bannersWithUrls,
      count: bannersWithUrls.length,
    });
  } catch (error) {
    console.error("Error fetching banner images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banner images",
      error: error.message,
    });
  }
};

// Create new banner image
const createBannerImage = async (req, res) => {
  try {
    const { title, altText, link, type, isActive, order } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Process image with Sharp
    const width = type === "mobile" ? 600 : 1200;
    const height = type === "mobile" ? 150 : 300;

    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(width, height, {
        fit: "contain", // Preserve aspect ratio
        background: { r: 255, g: 255, b: 255 }, // White background for padding
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload to Azure
    const uniqueName = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    const azureUrl = await uploadToAzure(optimizedBuffer, uniqueName, "image/jpeg");

    const bannerImage = new BannerImage({
      title: title || "Untitled Banner",
      altText: altText || "Banner Image",
      imageUrl: azureUrl,
      link: link || "",
      type: type || "desktop",
      isActive: isActive !== "false",
      order: Number.parseInt(order) || 0,
      createdBy: new mongoose.Types.ObjectId(req.user.id),
    });

    await bannerImage.save();

    res.status(201).json({
      success: true,
      message: "Banner image created successfully",
      banner: {
        ...bannerImage.toObject(),
        imageUrl: azureUrl,
      },
    });
  } catch (error) {
    console.error("Error creating banner image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create banner image",
      error: error.message,
    });
  }
};

// Update banner image
const updateBannerImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, altText, link, type, isActive, order } = req.body;

    const banner = await BannerImage.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner image not found",
      });
    }

    // Update fields
    if (title !== undefined) banner.title = title;
    if (altText !== undefined) banner.altText = altText;
    if (link !== undefined) banner.link = link;
    if (type !== undefined) banner.type = type;
    if (isActive !== undefined) banner.isActive = isActive !== "false";
    if (order !== undefined) banner.order = Number.parseInt(order) || 0;

    // Handle new image upload
    if (req.file) {
      // Process new image
      const width = type === "mobile" ? 600 : 1200;
      const height = type === "mobile" ? 150 : 300;

      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(width, height, {
          fit: "contain", // Preserve aspect ratio
          background: { r: 255, g: 255, b: 255 },
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Upload new image to Azure
      const uniqueName = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const azureUrl = await uploadToAzure(optimizedBuffer, uniqueName, "image/jpeg");
      banner.imageUrl = azureUrl;
    }

    await banner.save();

    res.json({
      success: true,
      message: "Banner image updated successfully",
      banner: {
        ...banner.toObject(),
        imageUrl: banner.imageUrl, // Use Azure URL
      },
    });
  } catch (error) {
    console.error("Error updating banner image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update banner image",
      error: error.message,
    });
  }
};

// Delete banner image
const deleteBannerImage = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await BannerImage.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner image not found",
      });
    }

    // Note: Azure Blob deletion is not implemented here. Add if needed.
    await BannerImage.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Banner image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete banner image",
      error: error.message,
    });
  }
};

// Reorder banner images
const reorderBannerImages = async (req, res) => {
  try {
    const { orderUpdates } = req.body;

    if (!Array.isArray(orderUpdates)) {
      return res.status(400).json({
        success: false,
        message: "orderUpdates must be an array",
      });
    }

    const updatePromises = orderUpdates.map(({ id, order }) =>
      BannerImage.findByIdAndUpdate(id, { order: Number.parseInt(order) || 0 })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: "Banner order updated successfully",
    });
  } catch (error) {
    console.error("Error reordering banner images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder banner images",
      error: error.message,
    });
  }
};

// Get single banner image
const getBannerImage = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await BannerImage.findById(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner image not found",
      });
    }

    res.json({
      success: true,
      banner: {
        ...banner.toObject(),
        imageUrl: banner.imageUrl, // Use Azure URL
      },
    });
  } catch (error) {
    console.error("Error fetching banner image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banner image",
      error: error.message,
    });
  }
};

module.exports = {
  uploadBannerImage: upload.single("image"),
  getBannerImages,
  getBannerImage,
  createBannerImage,
  updateBannerImage,
  deleteBannerImage,
  reorderBannerImages,
};