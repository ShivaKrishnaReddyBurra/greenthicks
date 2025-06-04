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

// Add CORS middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://greenthicks-backend.azurewebsites.net",
      process.env.SECOND_FRONTEND_URL,
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(passport.initialize());

connectDB();

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

app.get("/api/greenthicks", (req, res) => {
  res.json({ message: "API is working" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));