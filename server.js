const express = require('express');
const cors = require('cors'); // Add this
const connectDB = require('./config/db');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();

// Add CORS middleware
app.use(cors({
  origin: ['https://greenthicks-backend.azurewebsites.net'], // Replace with your frontend domain
  credentials: true,
}));

app.use(express.json());
app.use(passport.initialize());

connectDB();

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));