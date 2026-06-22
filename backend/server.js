require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser'); // Naya add kiya

const authRoutes = require('./routes/authRoutes');
const farmRoutes = require('./routes/farmRoutes');

const app = express();

// CORS Settings update karni hogi taaki cookies frontend se accept ho sakein
app.use(cors({
  origin: 'http://localhost:5176', // Tumhara exact frontend URL daalna yahan
  credentials: true // Ye allow karega HttpOnly cookies ko cross-origin send hona
}));

app.use(express.json());
app.use(cookieParser()); // Middleware to parse cookies attached to client request

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch((err) => console.log('❌ MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));