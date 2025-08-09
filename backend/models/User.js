import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  // Core auth
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  // Profile
  bio: String,
  avatar: String,
  phoneNumber: String,
  dateOfBirth: Date,
  address: {
    street: String, city: String, state: String, zip: String, country: String
  },
  socialLinks: { type: Map, of: String },
  metadata: mongoose.Schema.Types.Mixed,

  // Auth security
  refreshToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastPasswordChange: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,

  // Roles & permissions
  role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
  permissions: [{ type: String }],

  // Status
  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },

  // Audit
  loginHistory: [
    { ip: String, userAgent: String, loginAt: { type: Date, default: Date.now } }
  ],
  createdBy: String,
  updatedBy: String,

  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

export default mongoose.model("User", userSchema);
