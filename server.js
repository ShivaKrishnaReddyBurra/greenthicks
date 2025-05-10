const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/addresses');
const couponRoutes = require('./routes/coupons');
const invoiceRoutes = require('./routes/invoices');
const deliveryRoutes = require('./routes/delivery');
const serviceAreaRoutes = require('./routes/serviceAreas');
const favoritesRoutes = require('./routes/favorites');

require('dotenv').config();

const app = express();

// Add CORS middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'https://greenthicks-backend.azurewebsites.net'],
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/service-areas', serviceAreaRoutes);
app.use('/api/favorites', favoritesRoutes);
app.get('/api/greenthicks', (req, res) => {
  res.json({ message: 'API is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));