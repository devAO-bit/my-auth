import AppError from "../utils/AppError.js";
import User from "../models/User.js";
import config from "../config/env.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.utils.js";
import { storeRefreshToken } from "./auth.service.helpers.js";


// Register
export const registerUser = async ({ name, email, password }, req) => {
  const exists = await User.findOne({ email });
  if (exists) throw new AppError("Email already registered", 409);

  const user = await User.create({ name, email, password });
  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = signRefreshToken({ id: user._id });

  await storeRefreshToken(user, refreshToken, req);

  return { user, accessToken, refreshToken };
};

// login
export const loginUser = async ({ email, password }, req) => {
  const user = await User.findOne({ email }).select("+password +refreshTokens");
  if (!user) throw new AppError("Invalid email or password", 401);

  if (user.isLocked) throw new AppError("Account locked. Try later or reset password.", 423);

  const match = await user.comparePassword(password);
  if (!match) {
    await user.incrementLoginAttempts();
    throw new AppError("Invalid email or password", 401);
  }

  await user.resetLoginAttempts();
  user.lastLogin = new Date();
  user.loginHistory.push({ ip: req.ip, userAgent: req.get("User-Agent") });
  await user.save({ validateBeforeSave: false });

  const accessToken = signAccessToken({ id: user._id });
  const refreshToken = signRefreshToken({ id: user._id });
  await storeRefreshToken(user, refreshToken, req);

  return { user, accessToken, refreshToken };
};

// Refresh Access token
export const refreshAccessToken = async (incomingRefreshToken, req) => {
  if (!incomingRefreshToken) throw new AppError("No refresh token provided", 401);
  const token = incomingRefreshToken.trim();

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(payload.id).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404);

  const exists = (user.refreshTokens || []).some(rt => rt.token === token);
  if (!exists) throw new AppError("Refresh token not valid", 401);

  // rotate: remove old, issue new
  user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);

  const accessToken = signAccessToken({ id: user._id });
  const newRefreshToken = signRefreshToken({ id: user._id });

  await storeRefreshToken(user, newRefreshToken, req);

  return { accessToken, refreshToken: newRefreshToken, user };
};

// Logout Single
export const logoutUser = async (userId, refreshToken) => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404);

  user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.token !== (refreshToken || "").trim());
  await user.save({ validateBeforeSave: false });
};

// Logout all session
export const logoutAll = async (userId) => {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404);

  user.refreshTokens = [];
  await user.save({ validateBeforeSave: false });
};