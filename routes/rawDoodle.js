const express = require('express');
const path = require('path');
const fs = require('fs');
const Doodle = require('../models/Doodle');
const { getFilePath } = require('../utils/storage');
const { convertTo2bpp } = require('../utils/imageProcess');

const router = express.Router();

// GET /api/raw-doodle/:id - Get raw 2bpp binary data for a doodle
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid doodle ID'
      });
    }

    // Find the doodle in the database
    const doodle = await Doodle.findById(id);
    if (!doodle) {
      return res.status(404).json({
        success: false,
        error: 'Doodle not found'
      });
    }

    // Get the processed image path
    const processedFileName = path.basename(doodle.processed_path);
    const processedPath = getFilePath(processedFileName, 'processed');

    // Check if the processed file exists
    if (!fs.existsSync(processedPath)) {
      return res.status(404).json({
        success: false,
        error: 'Processed image file not found'
      });
    }

    // Convert to 2bpp binary format
    const binaryData = await convertTo2bpp(processedPath);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', binaryData.length);
    res.setHeader('Content-Disposition', `attachment; filename="doodle-${id}.bin"`);

    // Send the binary data
    res.send(binaryData);

  } catch (error) {
    console.error('Raw doodle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process raw doodle request'
    });
  }
});

module.exports = router;