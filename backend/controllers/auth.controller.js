import { registerUser, loginUser, refreshAccessToken, logoutUser, logoutAll } from "../services/auth.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

// register
export const registerController = asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);

    const user = await registerUser(name, email, password);

    res.status(201).json({
        status: "success",
        message: "User registered successfully",
        data: user
    });
});

// login
export const loginController = asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await loginUser(email, password);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 3600 * 1000 // 7 days
    });

    res.status(200).json({
        status: "success",
        message: "Login successful",
        data: { user, accessToken, refreshToken }
    });
});

// Refresh Access Token
export const refreshAccessTokenController = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await refreshAccessToken(refreshToken);

    res.status(200).json({
        status: "success",
        data: tokens,
    });
});

// Logout Controller
export const logoutController = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    await logoutUser(req.user.id, refreshToken);

    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });
});

// Logout from all devices
export const logoutAllController = asyncHandler(async (req, res) => {
  await logoutAll(req.user.id);
  res.status(200).json({ status: "success", message: "Logged out from all devices" });
});