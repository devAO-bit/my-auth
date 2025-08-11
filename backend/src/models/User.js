import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import config from "../config/env.js";

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, select: false },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const LoginHistorySchema = new mongoose.Schema({
  ip: String,
  userAgent: String,
  loginAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  password: { type: String, required: true, minlength: 8, select: false },

  bio: { type: String, trim: true, default: "" },
  avatar: String,
  phoneNumber: { type: String, match: [/^\+?[0-9]{7,15}$/, "Invalid phone number"] },
  dateOfBirth: Date,
  address: { street: String, city: String, state: String, zip: String, country: String },
  socialLinks: { type: Map, of: String },
  metadata: mongoose.Schema.Types.Mixed,

  refreshToken: { type: [RefreshTokenSchema], default: [] },

  passwordResetToken: { type: String, select: false },
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastPasswordChange: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },

  role: { type: String, enum: ["user", "admin", "moderator"], default: "user" },
  permissions: [{ type: String }],

  isVerified: { type: Boolean, default: false },
  lastLogin: Date,
  status: { type: String, enum: ["active", "inactive", "banned"], default: "active" },

  loginHistory: { type: [LoginHistorySchema], default: [] },

  createdBy: String,
  updatedBy: String,

  isDeleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ status: 1 });

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(config.bcryptSaltRounds || 12);
  this.password = await bcrypt.hash(this.password, salt);
  this.lastPasswordChange = new Date();
  next();
});

// Keep loginHistory short
userSchema.pre("save", function (next) {
  if (this.loginHistory && this.loginHistory.length > 20) {
    this.loginHistory = this.loginHistory.slice(-20);
  }
  next();
});

// Exclude soft-deleted
userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// Virtual: id from _id
userSchema.virtual("id").get(function () {
  return this._id.toString();
});

// toJSON transform to remove sensitive fields
userSchema.options.toJSON = {
  transform(doc, ret) {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.twoFactorSecret;
    delete ret.refreshTokens;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
  },
  virtuals: true
};

// Instance methods
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

userSchema.methods.incrementLoginAttempts = function () {
  this.loginAttempts += 1;
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 60 * 60 * 1000; // 1 hour
  }
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.resetLoginAttempts = function () {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  return this.save({ validateBeforeSave: false });
};

userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Remove a single refresh token
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = (this.refreshTokens || []).filter(rt => rt.token !== token);
  return this.save({ validateBeforeSave: false });
};

// Clear all refresh tokens
userSchema.methods.clearRefreshTokens = function () {
  this.refreshTokens = [];
  return this.save({ validateBeforeSave: false });
};

export default mongoose.model("User", userSchema);
