import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import ApiError from '../utils/ApiError.js';

const hasCloudinaryConfig = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
};

export const uploadImage = async (fileBuffer, folder = 'zovex') => {
  if (!hasCloudinaryConfig()) {
    throw new ApiError('Cloudinary keys are missing. Add them to backend/.env first.', 400);
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
    );

    Readable.from(fileBuffer).pipe(uploadStream);
  });
};

export const deleteImage = async (publicId) => {
  if (!publicId) return;

  if (!hasCloudinaryConfig()) {
    throw new ApiError('Cloudinary keys are missing. Add them to backend/.env first.', 400);
  }

  await cloudinary.uploader.destroy(publicId);
};
