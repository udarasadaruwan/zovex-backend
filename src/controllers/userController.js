import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteImage, uploadImage } from '../services/mediaService.js';
import { changePasswordWithOtp, requestPasswordChangeOtp } from '../services/passwordResetService.js';

export const updateProfile = catchAsync(async (req, res) => {
  const profileUpdates = {
    ...(req.body.name !== undefined && { name: req.body.name }),
    ...(req.body.phone !== undefined && { phone: req.body.phone }),
    ...(req.body.address !== undefined && { address: req.body.address })
  };
  const user = await User.findByIdAndUpdate(req.user._id, profileUpdates, {
    new: true,
    runValidators: true
  }).select('-password');

  res.json({ user });
});

export const updatePassword = catchAsync(async (req, res) => {
  await changePasswordWithOtp({ userId: req.user._id, ...req.body });
  res.json({ message: 'Password updated successfully.' });
});

export const sendProfilePasswordOtp = catchAsync(async (req, res) => {
  await requestPasswordChangeOtp(req.user._id);
  res.json({ message: 'A password change OTP has been emailed to your account.' });
});

export const uploadProfileImage = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError('Please upload an image file.', 400);
  }

  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    throw new ApiError('User not found.', 404);
  }

  if (currentUser.avatarPublicId) {
    await deleteImage(currentUser.avatarPublicId);
  }

  const image = await uploadImage(req.file.buffer, 'zovex/avatars');
  currentUser.avatar = image.url;
  currentUser.avatarPublicId = image.publicId;
  await currentUser.save({ validateBeforeSave: false });

  const user = await User.findById(req.user._id).select('-password');
  res.json({ user });
});

export const deleteProfileImage = catchAsync(async (req, res) => {
  const currentUser = await User.findById(req.user._id);

  if (!currentUser) {
    throw new ApiError('User not found.', 404);
  }

  if (currentUser.avatarPublicId) {
    await deleteImage(currentUser.avatarPublicId);
  }

  currentUser.avatar = undefined;
  currentUser.avatarPublicId = undefined;
  await currentUser.save({ validateBeforeSave: false });

  const user = await User.findById(req.user._id).select('-password');
  res.json({ user });
});

export const listUsers = catchAsync(async (_req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({ users });
});

export const updateUserRole = catchAsync(async (req, res) => {
  const allowedRoles = ['user', 'seller', 'admin'];

  if (!allowedRoles.includes(req.body.role)) {
    throw new ApiError('Invalid role selected.', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    throw new ApiError('User not found.', 404);
  }

  res.json({ user });
});
