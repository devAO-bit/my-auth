import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwtAccessSecret, { expiresIn: config.jwtAccessExpires });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpires });

export const verifyAccessToken = (token) =>
  jwt.verify(token, config.jwtAccessSecret);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, config.jwtRefreshSecret);

export default {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
