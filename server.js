const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const passport = require("./config/passport");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");
const cartRoutes = require("./routes/cart");
const addressRoutes = require("./routes/addresses");
const couponRoutes = require("./routes/coupons");
const invoiceRoutes = require("./routes/invoices");
const deliveryRoutes = require("./routes/delivery");
const serviceAreaRoutes = require("./routes/serviceAreas");
const favoritesRoutes = require("./routes/favorites");
const adminRoutes = require("./routes/admin");
const adminNotificationsRoutes = require("./routes/adminNotifications");
const adminSettingsRoutes = require("./routes/adminSettings");
const cancellationsRoutes = require("./routes/cancellations");
const returnsRoutes = require("./routes/returns");
const usersRoutes = require("./routes/users"); // Added to address MODULE_NOT_FOUND

require("dotenv").config();

const app = express();

// Environment variables validation
console.log("🔍 Checking environment variables...")

const requiredEnvVars = ["MONGODB_URI"]
const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error("❌ Missing required environment variables:", missingEnvVars.join(", "))
  console.log("📝 Please add these to your .env file")
}

// Optional environment variables (with warnings)
const optionalEnvVars = {
  RAZORPAY_KEY_ID: "Payment functionality will be disabled",
  RAZORPAY_KEY_SECRET: "Payment functionality will be disabled",
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "Map functionality will be limited",
  EMAIL_USER: "Email notifications will be disabled",
  EMAIL_PASS: "Email notifications will be disabled",
  WHATSAPP_ACCESS_TOKEN: "WhatsApp messaging will be disabled",
  TWILIO_ACCOUNT_SID: "SMS functionality will be disabled",
}

Object.entries(optionalEnvVars).forEach(([varName, warning]) => {
  if (!process.env[varName]) {
    console.warn(`⚠️  ${varName} not set - ${warning}`)
  } else {
    console.log(`✅ ${varName} configured`)
  }
})

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://greenthicks-backend.azurewebsites.net",
      process.env.SECOND_FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:3001",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  }),
)

  // Middleware setup
app.use(express.json());
app.use(passport.initialize());

connectDB();

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    services: {
      razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      email: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      maps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      whatsapp: !!process.env.WHATSAPP_ACCESS_TOKEN,
      sms: !!process.env.TWILIO_ACCOUNT_SID,
    },
  })
})

// API test endpoint
app.get("/api/greenthicks", (req, res) => {
  res.json({
    message: "GreenThicks API is working",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  })
})

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/service-areas", serviceAreaRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/notifications", adminNotificationsRoutes);
app.use("/api/admin/settings", adminSettingsRoutes);
app.use("/api/cancellations", cancellationsRoutes);
app.use("/api/returns", returnsRoutes);
app.use("/api/users", usersRoutes); // Added users route
app.use("/api/delivery-map", require("./routes/deliveryMap"));
app.use("/api/delivery-dashboard", require("./routes/deliveryDashboard"));
app.use("/api/delivery-profile", require("./routes/deliveryProfile"));
app.use("/api/delivery-settings", require("./routes/deliverySettings"));
app.use("/api/delivery-admin", require("./routes/deliveryAdmin"));


// Routes with error handling
const routes = [
  { path: "/api/auth", module: authRoutes, name: "Authentication" },
  { path: "/api/products", module: productRoutes, name: "Products" },
  { path: "/api/orders", module: orderRoutes, name: "Orders" },
  { path: "/api/cart", module: cartRoutes, name: "Cart" },
  { path: "/api/addresses", module: addressRoutes, name: "Addresses" },
  { path: "/api/coupons", module: couponRoutes, name: "Coupons" },
  { path: "/api/invoices", module: invoiceRoutes, name: "Invoices" },
  { path: "/api/delivery", module: deliveryRoutes, name: "Delivery" },
  { path: "/api/service-areas", module: serviceAreaRoutes, name: "Service Areas" },
  { path: "/api/favorites", module: favoritesRoutes, name: "Favorites" },
  { path: "/api/admin", module: adminRoutes, name: "Admin" },
  { path: "/api/admin/notifications", module: adminNotificationsRoutes, name: "Admin Notifications" },
  { path: "/api/admin/settings", module: adminSettingsRoutes, name: "Admin Settings" },
  { path: "/api/cancellations", module: cancellationsRoutes, name: "Cancellations" },
  { path: "/api/returns", module: returnsRoutes, name: "Returns" },
  { path: "/api/users", module: usersRoutes, name: "Users" },
]

// Load core routes
routes.forEach(({ path, module, name }) => {
  try {
    app.use(path, module)
    console.log(`✅ ${name} routes loaded: ${path}`)
  } catch (error) {
    console.error(`❌ Failed to load ${name} routes:`, error.message)
  }
})

// Load additional routes with require (with error handling)
const additionalRoutes = [
  { path: "/api/delivery-map", file: "./routes/deliveryMap", name: "Delivery Map" },
  { path: "/api/delivery-dashboard", file: "./routes/deliveryDashboard", name: "Delivery Dashboard" },
  { path: "/api/delivery-profile", file: "./routes/deliveryProfile", name: "Delivery Profile" },
  { path: "/api/delivery-settings", file: "./routes/deliverySettings", name: "Delivery Settings" },
  { path: "/api/delivery-admin", file: "./routes/deliveryAdmin", name: "Delivery Admin" },
]

additionalRoutes.forEach(({ path, file, name }) => {
  try {
    app.use(path, require(file))
    console.log(`✅ ${name} routes loaded: ${path}`)
  } catch (error) {
    console.error(`❌ Failed to load ${name} routes:`, error.message)
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🚨 Server Error:", err.stack)

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    })
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID format",
    })
  }

  if (err.code === 11000) {
    return res.status(400).json({
      message: "Duplicate field value",
    })
  }

  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
    availableRoutes: ["/api/auth", "/api/products", "/api/orders", "/api/cart", "/api/addresses", "/health"],
  })
})

app.get("/api/greenthicks", (req, res) => {
  res.json({ message: "API is working" });
});

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`\n🚀 GreenThicks Server Started Successfully!`)
  console.log(`📍 Port: ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`🧪 API test: http://localhost:${PORT}/api/greenthicks`)

  // Display service status
  console.log(`\n📋 Service Status:`)
  console.log(
    `   💳 Razorpay: ${process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET ? "✅ Ready" : "⚠️  Not configured"}`,
  )
  console.log(`   🗺️  Google Maps: ${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "✅ Ready" : "⚠️  Not configured"}`)
  console.log(`   📧 Email: ${process.env.EMAIL_USER && process.env.EMAIL_PASS ? "✅ Ready" : "⚠️  Not configured"}`)
  console.log(`   📱 WhatsApp: ${process.env.WHATSAPP_ACCESS_TOKEN ? "✅ Ready" : "⚠️  Not configured"}`)
  console.log(`   💬 SMS: ${process.env.TWILIO_ACCOUNT_SID ? "✅ Ready" : "⚠️  Not configured"}`)

  console.log(`\n🎉 Server is ready to handle requests!`)
})

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🛑 SIGTERM received. Shutting down gracefully...")
  process.exit(0)
})

process.on("SIGINT", () => {
  console.log("\n🛑 SIGINT received. Shutting down gracefully...")
  process.exit(0)
})

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("🚨 Uncaught Exception:", err)
  process.exit(1)
})

process.on("unhandledRejection", (err) => {
  console.error("🚨 Unhandled Rejection:", err)
  process.exit(1)
})