// server/src/routes/energyRoutes.js
const express = require('express');
const router = express.Router();
const EnergyController = require('../controllers/energyController');
const { protect } = require('../middleware/auth'); 

/**
 * Energy Dashboard Routes
 */

// Get all energy files
router.get('/files', protect, EnergyController.getEnergyFiles);

// Process energy data from file
router.post('/process/:fileId', protect, EnergyController.processEnergyFile);

// Get processed metrics
router.get('/metrics/:fileId', protect, EnergyController.getMetrics);

// Get dashboard summary
router.get('/dashboard-summary', protect, EnergyController.getDashboardSummary);

// Compare multiple datasets
router.post('/compare', protect, EnergyController.compareDatasets);

// Get trend analysis
router.get('/trends/:fileId', protect, EnergyController.getTrendAnalysis);

// Get recommendations
router.get('/recommendations/:fileId', protect, EnergyController.getRecommendations);

// Export data
router.get('/export/:fileId', protect, EnergyController.exportData);

module.exports = router;