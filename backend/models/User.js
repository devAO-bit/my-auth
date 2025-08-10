import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
 // Core auth
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

  // Profile
  bio: { type: String, trim: true },
  avatar: String,
  phoneNumber: {
    type: String,
    match: [/^\+?[0-9]{7,15}$/, "Invalid phone number format"]
  },
  dateOfBirth: Date,
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  socialLinks: { type: Map, of: String },
  metadata: mongoose.Schema.Types.Mixed,

  // Auth security
  refreshToken: { type: String, select: false },
  passwordResetToken: { type: String, select: false },
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  lastPasswordChange: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },

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

// ===== MIDDLEWARE =====
// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Limit login history size
userSchema.pre("save", function (next) {
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  next();
});

// Exclude soft-deleted docs by default
userSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

// ===== INSTANCE METHODS =====
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  return resetToken;
};

export default mongoose.model("User", userSchema);