// server/src/routes/water.js 
const express = require('express');
const router = express.Router();
const WaterController = require('../controllers/waterController');
const { protect } = require('../middleware/auth');

/**
 * Water Dashboard Routes - Multi-BU Support with Environmental CSV
 */

// Get all water files
router.get('/files', protect, WaterController.getWaterFiles);

// Process water data from file
router.post('/process/:fileId', protect, WaterController.processWaterFile);

// Get processed metrics
router.get('/metrics/:fileId', protect, WaterController.getMetrics);

// Export data
router.get('/export/:fileId', protect, WaterController.exportData);

// ⚠️ DEPRECATED: Old route for backward compatibility
// This was your old water/data/:fileId route - now redirects to new process flow
router.get('/data/:fileId', protect, async (req, res) => {
  try {
    // First process the file
    await WaterController.processWaterFile(req, res);
  } catch (error) {
    console.error('❌ Error in legacy water/data route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process water data',
      message: error.message
    });
  }
});

module.exports = router;
