import { uploadImage } from '../services/mediaService.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

export const uploadProductImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError('Please upload an image file.', 400);
  }

  const image = await uploadImage(req.file.buffer, 'zovex/products');
  res.status(201).json({ image });
});
