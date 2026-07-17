const ImageKit = require("imagekit");
const sharp = require("sharp");

let imagekit = null;

const getImageKit = () => {
  if (!imagekit) {
    if (
      process.env.IMAGEKIT_PRIVATE_KEY &&
      process.env.IMAGEKIT_PUBLIC_KEY &&
      process.env.IMAGEKIT_URL_ENDPOINT
    ) {
      imagekit = new ImageKit({
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
      });
    }
  }
  return imagekit;
};

/**
 * Compress a file buffer using sharp before uploading.
 * Resizes to max 1920px wide, compresses JPEG to quality 80.
 * @param {Buffer} buffer
 * @returns {Buffer} compressed buffer
 */
const compressImage = async (buffer) => {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
};

const prepareImageBuffer = async (file) => {
  try {
    return await compressImage(file.buffer);
  } catch (err) {
    console.warn(`[Storage] Image compression failed for ${file.originalname}: ${err.message}`);
    return file.buffer;
  }
};

/**
 * Upload multiple files to ImageKit.
 * Returns array of { url, fileId } objects.
 * Falls back to empty array if ImageKit is not configured.
 * @param {Express.Multer.File[]} files
 * @param {string[]} [existingUrls] - existing image URLs to prepend
 * @returns {{ urls: string[], fileIds: string[] }}
 */
const uploadImages = async (files, existingUrls = []) => {
  const ik = getImageKit();
  const urls = Array.isArray(existingUrls) ? [...existingUrls] : [];
  const fileIds = [];

  if (!files?.length) {
    return { urls, fileIds };
  }

  if (!ik) {
    for (const file of files) {
      try {
        const compressed = await prepareImageBuffer(file);
        urls.push(`data:image/jpeg;base64,${compressed.toString("base64")}`);
      } catch (err) {
        console.warn(`[Storage] Skipping unreadable image ${file.originalname}: ${err.message}`);
      }
    }
    return { urls, fileIds };
  }

  for (const file of files) {
    try {
      const compressed = await prepareImageBuffer(file);
      const item = await ik.upload({
        file: compressed,
        fileName: file.originalname,
        folder: "/rentconnect",
      });
      urls.push(item.url);
      fileIds.push(item.fileId);
    } catch (err) {
      console.warn(`[Storage] Skipping unreadable image ${file.originalname}: ${err.message}`);
    }
  }

  return { urls, fileIds };
};

/**
 * Delete files from ImageKit by their fileIds.
 * Silently ignores errors to avoid crashing on delete.
 * @param {string[]} fileIds
 */
const deleteImages = async (fileIds = []) => {
  const ik = getImageKit();
  if (!ik || !fileIds.length) return;

  await Promise.allSettled(
    fileIds.map((fileId) => ik.deleteFile(fileId))
  );
};

module.exports = { uploadImages, deleteImages };
