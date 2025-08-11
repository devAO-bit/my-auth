import { verifyAccessToken } from "../utils/jwt.util.js";
import AppError from "../utils/AppError.js";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
    try {
        const token = req.cookies?.access_token || (req.headers.authorization || "").replace("Bearer ", "");
        if (!token) return next(new AppError("Not authenticated", 401));
        const payload = verifyAccessToken(token);
        const user = await User.findById(payload.id);
        if (!user) return next(new AppError("User not found", 401));
        req.user = { id: user._id, role: user.role };
        next();
    } catch (err) {
        return next(new AppError("Invalid or expired token", 401));
    }
};
