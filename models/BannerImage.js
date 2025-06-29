const mongoose = require("mongoose");

const bannerImageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  altText: { type: String, required: true },
  imageUrl: { type: String, required: true },
  link: { type: String, default: "" },
  type: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

bannerImageSchema.statics.getAllByType = async function (type) {
  console.log(`Querying all banners for type: ${type}`);
  const banners = await this.find({ type }).sort({ order: 1 });
  console.log(`Found ${banners.length} banners:`, banners);
  return banners;
};

bannerImageSchema.statics.getActiveByType = async function (type) {
  console.log(`Querying active banners for type: ${type}`);
  const banners = await this.find({ type, isActive: true }).sort({ order: 1 });
  console.log(`Found ${banners.length} active banners:`, banners);
  return banners;
};

module.exports = mongoose.model("BannerImage", bannerImageSchema);