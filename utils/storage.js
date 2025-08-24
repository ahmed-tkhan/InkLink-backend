const fs = require('fs');
const path = require('path');

// Create storage directories if they don't exist
const storageDir = path.join(__dirname, '..', 'storage');
const originalDir = path.join(storageDir, 'original');
const processedDir = path.join(storageDir, 'processed');

// Ensure directories exist
[storageDir, originalDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Save file to local storage
 * @param {string} sourcePath - Path to the source file
 * @param {string} fileName - Name for the stored file
 * @param {string} type - 'original' or 'processed'
 * @returns {Promise<string>} - Path to the stored file
 */
const saveFile = async (sourcePath, fileName, type = 'original') => {
  const targetDir = type === 'processed' ? processedDir : originalDir;
  const targetPath = path.join(targetDir, fileName);
  
  return new Promise((resolve, reject) => {
    fs.copyFile(sourcePath, targetPath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(targetPath);
      }
    });
  });
};

/**
 * Get file URL for serving
 * @param {string} fileName - Name of the file
 * @param {string} type - 'original' or 'processed'
 * @returns {string} - URL path for serving the file
 */
const getFileUrl = (fileName, type = 'original') => {
  return `/files/${type}/${fileName}`;
};

/**
 * Delete file from local storage
 * @param {string} fileName - Name of the file to delete
 * @param {string} type - 'original' or 'processed'
 * @returns {Promise<boolean>} - Success status
 */
const deleteFile = async (fileName, type = 'original') => {
  const targetDir = type === 'processed' ? processedDir : originalDir;
  const filePath = path.join(targetDir, fileName);
  
  return new Promise((resolve) => {
    fs.unlink(filePath, (err) => {
      resolve(!err); // Return true if no error (file deleted successfully)
    });
  });
};

/**
 * Get absolute path to stored file
 * @param {string} fileName - Name of the file
 * @param {string} type - 'original' or 'processed'
 * @returns {string} - Absolute path to the file
 */
const getFilePath = (fileName, type = 'original') => {
  const targetDir = type === 'processed' ? processedDir : originalDir;
  return path.join(targetDir, fileName);
};

/**
 * Check if storage directories are writable
 * @returns {Promise<boolean>}
 */
const checkStorageAccess = async () => {
  try {
    const testFile = path.join(storageDir, '.storage_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return true;
  } catch (error) {
    console.error('Storage Access Error:', error);
    return false;
  }
};

module.exports = {
  saveFile,
  getFileUrl,
  deleteFile,
  getFilePath,
  storageDir,
  originalDir,
  processedDir,
  checkStorageAccess
};
