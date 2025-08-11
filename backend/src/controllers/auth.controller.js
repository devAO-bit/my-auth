import * as authService from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import config from "../config/env.js";

// Set cookie options
const setTokenCookies = (res, accessToken, refreshToken) => {
  const secure = config.nodeEnv === "production";
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: 1000 * 60 * 15 // 15 minutes
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    maxAge: 7 * 24 * 3600 * 1000 // match REFRESH token expiry
  });
};

export const registerController = asyncHandler(async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.registerUser(payload, req);
  setTokenCookies(res, accessToken, refreshToken);
  res.status(201).json({ status: "success", data: { user } });
});

export const loginController = asyncHandler(async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const { user, accessToken, refreshToken } = await authService.loginUser(payload, req);
  setTokenCookies(res, accessToken, refreshToken);
  res.status(200).json({ status: "success", data: { user } });
});

export const refreshAccessTokenController = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  const { accessToken, refreshToken } = await authService.refreshAccessToken(token, req);
  setTokenCookies(res, accessToken, refreshToken);
  res.status(200).json({ status: "success", data: { accessToken } });
});

export const logoutController = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  const userId = req.user?.id || req.body?.userId;
  await authService.logoutUser(userId, token);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.status(200).json({ status: "success", message: "Logged out." });
});

export const logoutAllController = asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.body?.userId;
  await authService.logoutAll(userId);
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.status(200).json({ status: "success", message: "Logged out from all devices." });
});