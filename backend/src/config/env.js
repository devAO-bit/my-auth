import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const get = (key, fallback = undefined) => process.env[key] ?? fallback;

export default {
  nodeEnv: get("NODE_ENV", "development"),
  port: parseInt(get("PORT", 3000)),
  mongoUri: get("MONGODB_URI"),
  jwtAccessSecret: get("JWT_ACCESS_SECRET"),
  jwtRefreshSecret: get("JWT_REFRESH_SECRET"),
  jwtAccessExpires: get("JWT_ACCESS_EXPIRES", "15m"),
  jwtRefreshExpires: get("JWT_REFRESH_EXPIRES", "7d"),
  bcryptSaltRounds: parseInt(get("BCRYPT_SALT_ROUNDS", "12")),
//   frontendUrl: get("FRONTEND_URL", "http://localhost:3000")
};
