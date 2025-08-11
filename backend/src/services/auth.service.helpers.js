import config from "../config/env.js";

const MAX_REFRESH_TOKENS = 5;

export const storeRefreshToken = async (user, token, req = {}) => {
  const tokenVal = token.trim();

  // clear any existing identical
  user.refreshTokens = (user.refreshTokens || []).filter(rt => rt.token !== tokenVal);

  // push new
  user.refreshTokens.push({
    token: tokenVal,
    ip: req.ip || "",
    userAgent: req.get?.("User-Agent") || req.headers?.["user-agent"] || ""
  });

  // prune old
  if (user.refreshTokens.length > MAX_REFRESH_TOKENS) {
    user.refreshTokens = user.refreshTokens.slice(-MAX_REFRESH_TOKENS);
  }

  await user.save({ validateBeforeSave: false });
};
