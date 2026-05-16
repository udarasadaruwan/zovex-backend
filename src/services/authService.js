import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendWelcomeEmail } from './emailService.js';

export const registerUser = async ({ name, email, password, role }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError('An account already exists with this email.', 409);
  }

  const requestedRole = role === 'seller' ? 'seller' : 'user';
  const user = await User.create({ name, email, password, role: requestedRole });
  sendWelcomeEmail(user);
  return user;
};

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user || !user.password || !(await user.matchPassword(password))) {
    throw new ApiError('Invalid email or password.', 401);
  }

  return user;
};
