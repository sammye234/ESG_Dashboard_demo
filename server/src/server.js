//server/src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');
const config = require('./config/config');
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const uploadRoutes = require('./routes/upload');
const widgetRoutes = require('./routes/widgets');
const kpiRoutes = require('./routes/kpi');
const waterRoutes = require('./routes/water');
const wasteRoutes = require('./routes/waste');
const energyRoutes = require('./routes/energyRoutes');



// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  //origin: config.CLIENT_URL,
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ESG Dashboard API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/waste', wasteRoutes);
app.use('/api/energy', energyRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`🌍 CORS enabled for: ${config.CLIENT_URL}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;