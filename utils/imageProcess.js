const sharp = require('sharp');
const path = require('path');

/**
 * Process image to 4-color grayscale
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for processed image
 * @returns {Promise<void>}
 */
const processGrayscale = async (inputPath, outputPath) => {
  try {
    // Convert to grayscale, resize to 200x200 (contain with white background), then get raw pixel data
    const { data, info } = await sharp(inputPath)
      .grayscale()
      .resize(200, 200, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 }
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Create 4-level posterized grayscale (0,85,170,255)
    const posterizedData = Buffer.from(data.map(level => {
      if (level < 64) return 0;
      if (level < 128) return 85;
      if (level < 192) return 170;
      return 255;
    }));

    // Write out as single-channel PNG with the resized dimensions
    await sharp(posterizedData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 1
      }
    })
    .png()
    .toFile(outputPath);

    console.log(`Image processed successfully: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error('Image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

/**
 * Create a thumbnail version of the image
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path for thumbnail
 * @param {number} size - Thumbnail size (default 200px)
 * @returns {Promise<void>}
 */
const createThumbnail = async (inputPath, outputPath, size = 200) => {
  try {
    await sharp(inputPath)
      .resize(size, size, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
      
    console.log(`Thumbnail created: ${inputPath} -> ${outputPath}`);
  } catch (error) {
    console.error('Thumbnail creation error:', error);
    throw new Error(`Failed to create thumbnail: ${error.message}`);
  }
};

/**
 * Get image metadata
 * @param {string} imagePath - Path to image
 * @returns {Promise<object>} - Image metadata
 */
const getImageMetadata = async (imagePath) => {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      channels: metadata.channels
    };
  } catch (error) {
    console.error('Metadata extraction error:', error);
    throw new Error(`Failed to get image metadata: ${error.message}`);
  }
};

/**
 * Validate if file is a supported image format
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>}
 */
const isValidImage = async (filePath) => {
  try {
    const metadata = await sharp(filePath).metadata();
    const supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp', 'tiff'];
    return supportedFormats.includes(metadata.format.toLowerCase());
  } catch (error) {
    return false;
  }
};

module.exports = {
  processGrayscale,
  createThumbnail,
  getImageMetadata,
  isValidImage
};
