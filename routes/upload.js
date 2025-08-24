const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Doodle = require('../models/Doodle');
const { saveFile, getFileUrl, deleteFile } = require('../utils/storage');
const { processGrayscale, isValidImage, getImageMetadata } = require('../utils/imageProcess');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/', // Temporary directory for uploads
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /upload - Handle file upload and processing
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file uploaded' 
      });
    }

    const { originalname, filename, path: tempPath, mimetype, size } = req.file;
    const uploader = req.body.uploader || 'anonymous';

    console.log(`Processing upload: ${originalname} by ${uploader}`);

    // Validate image
    const isValid = await isValidImage(tempPath);
    if (!isValid) {
      // Clean up temp file
      fs.unlinkSync(tempPath);
      return res.status(400).json({
        success: false,
        error: 'Invalid image format'
      });
    }

    // Generate unique filenames
    const timestamp = Date.now();
    const ext = path.extname(originalname);
    const baseName = path.basename(originalname, ext);
    const uniqueOriginal = `${baseName}-${timestamp}${ext}`;
    const uniqueProcessed = `${baseName}-${timestamp}-processed.png`;

    // Save original file
    const originalPath = await saveFile(tempPath, uniqueOriginal, 'original');
    
    // Process image to 4-color grayscale
    const processedTempPath = path.join('uploads', `processed-${filename}.png`);
    await processGrayscale(tempPath, processedTempPath);
    
    // Save processed file
    const processedPath = await saveFile(processedTempPath, uniqueProcessed, 'processed');

    // Clean up temp files
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    if (fs.existsSync(processedTempPath)) fs.unlinkSync(processedTempPath);

    // Get image metadata
    const metadata = await getImageMetadata(originalPath);

    // Save to database
    const doodle = await Doodle.create({
      filename: originalname,
      uploader: uploader,
      originalPath: originalPath,
      processedPath: processedPath,
      fileSize: size,
      mimeType: mimetype
    });

    // Return success response with file URLs
    res.json({
      success: true,
      doodle: {
        id: doodle.id,
        filename: doodle.filename,
        uploader: doodle.uploader,
        timestamp: doodle.timestamp,
        originalUrl: getFileUrl(uniqueOriginal, 'original'),
        processedUrl: getFileUrl(uniqueProcessed, 'processed'),
        fileSize: size,
        metadata: metadata
      }
    });

    console.log(`Upload successful: ${originalname} -> ID: ${doodle.id}`);

  } catch (error) {
    console.error('Upload error:', error);
    
    // Clean up temp files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

// GET /upload/list - Get all uploaded doodles
router.get('/list', async (req, res) => {
  try {
    const doodles = await Doodle.findAll();
    
    // Add URLs to each doodle
    const doodlesWithUrls = doodles.map(doodle => ({
      id: doodle.id,
      filename: doodle.filename,
      uploader: doodle.uploader,
      timestamp: doodle.timestamp,
      originalUrl: getFileUrl(path.basename(doodle.original_path), 'original'),
      processedUrl: getFileUrl(path.basename(doodle.processed_path), 'processed'),
      fileSize: doodle.file_size,
      mimeType: doodle.mime_type
    }));

    res.json({
      success: true,
      doodles: doodlesWithUrls
    });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doodles'
    });
  }
});

// GET /upload/:id - Get specific doodle by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doodle = await Doodle.findById(id);
    
    if (!doodle) {
      return res.status(404).json({
        success: false,
        error: 'Doodle not found'
      });
    }

    res.json({
      success: true,
      doodle: {
        id: doodle.id,
        filename: doodle.filename,
        uploader: doodle.uploader,
        timestamp: doodle.timestamp,
        originalUrl: getFileUrl(path.basename(doodle.original_path), 'original'),
        processedUrl: getFileUrl(path.basename(doodle.processed_path), 'processed'),
        fileSize: doodle.file_size,
        mimeType: doodle.mime_type
      }
    });
  } catch (error) {
    console.error('Get doodle error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve doodle'
    });
  }
});

// DELETE /upload/:id - Delete a doodle
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doodle = await Doodle.findById(id);
    
    if (!doodle) {
      return res.status(404).json({
        success: false,
        error: 'Doodle not found'
      });
    }

    // Delete files from storage
    await deleteFile(path.basename(doodle.original_path), 'original');
    await deleteFile(path.basename(doodle.processed_path), 'processed');

    // Delete from database
    await Doodle.deleteById(id);

    res.json({
      success: true,
      message: 'Doodle deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete doodle'
    });
  }
});

module.exports = router;
