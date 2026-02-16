import crypto from 'crypto';

export function buildDeviceFingerprint(params: {
  userAgent: string;
  ip?: string;
}) {
  const raw = [params.userAgent, params.ip ?? ''].join('|');

  return crypto.createHash('sha256').update(raw).digest('hex');
}
