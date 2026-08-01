import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

/** Generates a PNG QR image for a given token and saves it to disk. Returns the file path. */
export async function generateQrImage(token: string): Promise<string> {
  const dir = path.resolve(env.qrDir);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, `${token}.png`);
  // QR encodes ONLY the token string — never guest name/email/id (PRD §13).
  await QRCode.toFile(filePath, token, { width: 500, margin: 2 });
  return filePath;
}

export function qrFilePath(token: string): string {
  return path.resolve(env.qrDir, `${token}.png`);
}
