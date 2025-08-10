import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "../utils/AppError.js";

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || "15m";
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || "7d";

// --- JWT Sign Helper ---
const signToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

// --- Generate Access & Refresh Tokens ---
const generateTokens = (userId) => {
  const accessToken = signToken(
    { id: userId },
    process.env.JWT_SECRET,
    ACCESS_TOKEN_EXPIRY
  );

  const refreshToken = signToken(
    { id: userId },
    process.env.JWT_SECRET,
    REFRESH_TOKEN_EXPIRY
  );

  return { accessToken, refreshToken };
};

const storeRefreshToken = async (user, token) => {
  user.refreshToken.push({ token, createdAt: new Date() });
  await user.save({ validateBeforeSave: false });
};

// --- Register User ---
export const registerUser = async (name, email, password) => {
  // Check if email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  // Hash password
  // const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const newUser = await User.create({
    name,
    email,
    password
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(newUser._id);

  await storeRefreshToken(newUser, refreshToken);

  return {
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email
    },
    accessToken,
    refreshToken
  };
};

// --- Login User ---
export const loginUser = async (email, password) => {
  // Find user by email
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.isLocked) {
    throw new AppError("Account is locked", 403);
  }

  // console.log("User found:", user);

  // Check password
  const isMatch = await user.comparePassword(password);

  // console.log("Password match:", isMatch);
  if (!isMatch) {
    await user.incrementLoginAttempts();
    throw new AppError("Invalid email or password", 401);
  }

  // successful login
  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  // loginHistory logic should be handled in controller if req is needed

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);
  // Store refresh token in DB
  await storeRefreshToken(user, refreshToken);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email
    },
    accessToken,
    refreshToken
  };
};

// --- Refresh Access Token ---
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError("No refresh token provided", 401);
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken.trim(), process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const tokenExists = user.refreshToken.some(
    (rt) => rt.token === refreshToken.trim()
  );
  if (!tokenExists) {
    throw new AppError("Refresh token not valid", 401);
  }

  user.refreshToken = user.refreshToken.filter(
    (rt) => rt.token !== refreshToken.trim()
  );

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);

  await storeRefreshToken(user, newRefreshToken);

  return { accessToken, refreshToken: newRefreshToken };
};


// --- Logout User ---
export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  await user.removeRefreshToken(refreshToken);
};

export const logoutAll = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  await user.clearRefreshTokens();
};
