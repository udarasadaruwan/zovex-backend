import passport from 'passport';
import { loginUser, registerUser } from '../services/authService.js';
import { requestPasswordResetOtp, resetPasswordWithOtp } from '../services/passwordResetService.js';
import { createToken, sendTokenResponse } from '../services/tokenService.js';
import catchAsync from '../utils/catchAsync.js';
import ApiError from '../utils/ApiError.js';

export const register = catchAsync(async (req, res) => {
  const user = await registerUser(req.body);
  sendTokenResponse(user, 201, res);
});

export const login = catchAsync(async (req, res) => {
  const user = await loginUser(req.body);
  sendTokenResponse(user, 200, res);
});

export const logout = (_req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Signed out successfully.' });
};

export const me = (req, res) => {
  res.json({ user: req.user });
};

export const forgotPassword = catchAsync(async (req, res) => {
  await requestPasswordResetOtp(req.body.email);
  res.json({ message: 'If an account exists, a password reset OTP has been emailed.' });
});

export const resetPassword = catchAsync(async (req, res) => {
  await resetPasswordWithOtp(req.body);
  res.json({ message: 'Password reset successfully. You can now sign in.' });
});

export const googleStart = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return next(new ApiError('Google OAuth keys are missing.', 400));
  }

  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
};

export const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  (req, res) => {
    const token = createToken(req.user._id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/success?token=${token}`);
  }
];

export const googleFailure = (_req, res) => {
  res.status(401).json({ message: 'Google sign in failed.' });
};
