import { nanoid } from 'nanoid';
import crypto from 'crypto';

/** 22-char URL-safe invitation token, one per guest. */
export function generateInvitationToken(): string {
  return nanoid(22);
}

/** 32-char random QR token. Never encodes guest data — the QR image contains only this string. */
export function generateQrToken(): string {
  return 'qr_' + crypto.randomBytes(24).toString('base64url');
}

/** 22-char URL-safe token for public family page access. */
export function generatePartyToken(): string {
  return nanoid(22);
}
