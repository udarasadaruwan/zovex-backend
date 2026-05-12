import crypto from 'crypto';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendPasswordChangeOtpEmail, sendPasswordResetOtpEmail } from './emailService.js';

const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const createPasswordOtp = async (user, sendEmail) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.passwordResetOtp = hashOtp(otp);
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  await sendEmail(user, otp);
};

export const requestPasswordResetOtp = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    return;
  }

  await createPasswordOtp(user, sendPasswordResetOtpEmail);
};

export const requestPasswordChangeOtp = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError('User not found.', 404);
  }

  await createPasswordOtp(user, sendPasswordChangeOtpEmail);
};

export const resetPasswordWithOtp = async ({ email, otp, password }) => {
  const user = await User.findOne({
    email,
    passwordResetOtp: hashOtp(otp),
    passwordResetExpires: { $gt: Date.now() }
  }).select('+passwordResetOtp +passwordResetExpires');

  if (!user) {
    throw new ApiError('Invalid or expired OTP.', 400);
  }

  user.password = password;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
};

export const changePasswordWithOtp = async ({ userId, currentPassword, otp, password }) => {
  if (!password || password.length < 6) {
    throw new ApiError('New password must be at least 6 characters.', 400);
  }

  const user = await User.findOne({
    _id: userId,
    passwordResetOtp: hashOtp(otp),
    passwordResetExpires: { $gt: Date.now() }
  }).select('+password +passwordResetOtp +passwordResetExpires');

  if (!user) {
    throw new ApiError('Invalid or expired OTP.', 400);
  }

  if (user.password && !(await user.matchPassword(currentPassword || ''))) {
    throw new ApiError('Current password is incorrect.', 401);
  }

  user.password = password;
  user.passwordResetOtp = undefined;
  user.passwordResetExpires = undefined;
  user.provider = user.provider || 'local';
  await user.save();
};
