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

/**
 * Convert a processed 4-color grayscale PNG to 2bpp binary format
 * @param {string} inputPath - Path to processed 4-color grayscale PNG
 * @returns {Promise<Buffer>} - 2bpp binary data (4 pixels per byte, big-endian)
 */
const convertTo2bpp = async (inputPath) => {
  try {
    // Read the processed PNG and convert to single-channel grayscale
    const { data, info } = await sharp(inputPath)
      .grayscale() // Ensure single channel
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Verify it's 200x200
    if (info.width !== 200 || info.height !== 200) {
      throw new Error(`Invalid image dimensions: ${info.width}x${info.height}, expected 200x200`);
    }

    // Verify single channel after grayscale conversion
    if (info.channels !== 1) {
      throw new Error(`Invalid channels after grayscale conversion: ${info.channels}, expected 1`);
    }

    // Convert 4-color values (0,85,170,255) to 2-bit values (0,1,2,3)
    const convertValue = (pixel) => {
      if (pixel <= 42) return 0; // 0-42 → 0 (00)
      if (pixel <= 127) return 1; // 43-127 → 1 (01) 
      if (pixel <= 212) return 2; // 128-212 → 2 (10)
      return 3; // 213-255 → 3 (11)
    };

    // Pack 4 pixels per byte (big-endian)
    const totalPixels = data.length;
    const outputBytes = Math.ceil(totalPixels / 4);
    const result = Buffer.alloc(outputBytes);

    for (let i = 0; i < totalPixels; i += 4) {
      const pixel0 = convertValue(data[i] || 0);
      const pixel1 = convertValue(data[i + 1] || 0);
      const pixel2 = convertValue(data[i + 2] || 0);
      const pixel3 = convertValue(data[i + 3] || 0);
      
      // Pack 4 pixels into 1 byte (big-endian: pixel0 in bits 7-6, pixel1 in bits 5-4, etc.)
      const packedByte = (pixel0 << 6) | (pixel1 << 4) | (pixel2 << 2) | pixel3;
      result[Math.floor(i / 4)] = packedByte;
    }

    console.log(`Converted ${inputPath} to 2bpp binary: ${totalPixels} pixels → ${outputBytes} bytes`);
    return result;
  } catch (error) {
    console.error('2bpp conversion error:', error);
    throw new Error(`Failed to convert to 2bpp: ${error.message}`);
  }
};

module.exports = {
  processGrayscale,
  createThumbnail,
  getImageMetadata,
  isValidImage,
  convertTo2bpp
};
