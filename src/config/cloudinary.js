const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pharmacy/drugs',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 600, height: 600, crop: 'limit' },
      { quality: 'auto' },
      { format: 'auto' }
    ]
  },
});

const deleteImageFromCloudinary = async (imageUrl) => {
  try {
    // Extract public_id from Cloudinary URL
    const publicId = imageUrl.split('/').pop().split('.')[0];
    const fullPublicId = `pharmacy/drugs/${publicId}`;
    
    const result = await cloudinary.uploader.destroy(fullPublicId);
    return result;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

// Function to extract public ID from Cloudinary URL
const extractPublicId = (url) => {
  const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
  return matches ? matches[1] : null;
};

module.exports = {
  cloudinary,
  deleteImageFromCloudinary,
  extractPublicId
};