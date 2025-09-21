// Load environment variables - handle gracefully if dotenv is not available
try {
  require('dotenv').config();
} catch (error) {
  console.log('ℹ️  Running without dotenv - using environment variables directly');
}
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const uploadRoute = require('./routes/upload');
const { checkStorageAccess, storageDir } = require('./utils/storage');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from storage directory
app.use('/files', express.static(storageDir));

// API Routes
app.use('/upload', uploadRoute);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic info endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'DoodleDrop Backend',
    version: '1.0.0',
    description: 'Local image upload and processing service',
    endpoints: {
      upload: 'POST /upload',
      list: 'GET /upload/list',
      get: 'GET /upload/:id',
      delete: 'DELETE /upload/:id',
      files: 'GET /files/{type}/{filename}',
      health: 'GET /health'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field. Use "image" field name.'
    });
  }

  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize server
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Check storage access
    const storageOK = await checkStorageAccess();
    if (!storageOK) {
      console.error('❌ Storage access check failed');
      process.exit(1);
    }
    console.log('✅ Storage access check passed');

    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log('✅ Uploads directory ready');

    // Start server
    app.listen(PORT, () => {
      console.log('\n🚀 DoodleDrop Backend Server Started!');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`📁 Storage directory: ${storageDir}`);
      console.log(`💾 Database: SQLite (local file)`);
      console.log('\n📋 Available endpoints:');
      console.log(`   POST   http://localhost:${PORT}/upload`);
      console.log(`   GET    http://localhost:${PORT}/upload/list`);
      console.log(`   GET    http://localhost:${PORT}/upload/:id`);
      console.log(`   DELETE http://localhost:${PORT}/upload/:id`);
      console.log(`   GET    http://localhost:${PORT}/files/{type}/{filename}`);
      console.log(`   GET    http://localhost:${PORT}/health`);
      console.log('\n🎨 Ready to process your doodles!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
