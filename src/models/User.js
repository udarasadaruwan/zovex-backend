import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    avatar: String,
    avatarPublicId: String,
    provider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: String,
    role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
    passwordResetOtp: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    phone: String,
    address: {
      line1: String,
      city: String,
      postalCode: String,
      country: String
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
