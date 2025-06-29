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
    fileSize: 5 * 1024 * 1024,
  },
});

const getBannerImages = async (req, res) => {
  try {
    console.log("Raw query:", req.query); // Log raw query
    const { type = "desktop", showInactive } = req.query;
    console.log("Parsed params:", { type, showInactive });

    let banners;
    if (showInactive === "true") {
      banners = await BannerImage.getAllByType(type);
    } else {
      banners = await BannerImage.getActiveByType(type);
    }
    console.log("Fetched banners:", banners);

    const bannersWithUrls = banners.map((banner) => ({
      ...banner.toObject(),
      imageUrl: banner.imageUrl,
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

const createBannerImage = async (req, res) => {
  try {
    const { title, altText, link, type, isActive, order } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const width = type === "mobile" ? 600 : 1200;
    const height = type === "mobile" ? 150 : 300;

    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(width, height, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255 },
      })
      .jpeg({ quality: 85 })
      .toBuffer();

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

    if (title !== undefined) banner.title = title;
    if (altText !== undefined) banner.altText = altText;
    if (link !== undefined) banner.link = link;
    if (type !== undefined) banner.type = type;
    if (isActive !== undefined) banner.isActive = isActive !== "false";
    if (order !== undefined) banner.order = Number.parseInt(order) || 0;

    if (req.file) {
      const width = type === "mobile" ? 600 : 1200;
      const height = type === "mobile" ? 150 : 300;

      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(width, height, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255 },
        })
        .jpeg({ quality: 85 })
        .toBuffer();

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
        imageUrl: banner.imageUrl,
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
        imageUrl: banner.imageUrl,
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