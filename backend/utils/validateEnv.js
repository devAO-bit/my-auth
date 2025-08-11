const requiredEnv = [
  'PORT',
  'MONGODB_URI',
  'NODE_ENV',
  'JWT_SECRET',
  'BCRYPT_SALT_ROUNDS',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_ACCESS_EXPIRES',
  'JWT_REFRESH_EXPIRES'
];

export default function validateEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}