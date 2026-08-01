import dotenv from 'dotenv';
dotenv.config();

function get(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiBasePath: process.env.API_BASE_PATH ?? '/api/v1',

  mongoUri: get('MONGO_URI', 'mongodb://localhost:27017/eventpass'),

  jwtAccessSecret: get('JWT_ACCESS_SECRET', 'dev_access_secret_change_me'),
  jwtAccessExpires: get('JWT_ACCESS_EXPIRES', '15m'),
  jwtRefreshSecret: get('JWT_REFRESH_SECRET', 'dev_refresh_secret_change_me'),
  jwtRefreshExpires: get('JWT_REFRESH_EXPIRES', '30d'),

  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),

  clientUrl: get('CLIENT_URL', 'http://localhost:3000'),

  uploadDir: get('UPLOAD_DIR', 'uploads'),
  qrDir: get('QR_DIR', 'uploads/qr'),
};
