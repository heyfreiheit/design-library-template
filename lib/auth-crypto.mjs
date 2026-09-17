import {randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash, createCipheriv, createDecipheriv} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64, {N:32768, r:8, p:1, maxmem:64*1024*1024});
  return `scrypt-v1:${salt}:${hash.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  const [version, salt, hex] = stored.split(':');
  if (version !== 'scrypt-v1' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(hex)) return false;
  const hash = await scrypt(password, salt, 64, {N:32768, r:8, p:1, maxmem:64*1024*1024});
  return timingSafeEqual(hash, Buffer.from(hex,'hex'));
}
export const newToken = () => randomBytes(32).toString('base64url');
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
function encryptionKey() {
  const key = Buffer.from(process.env.VAULT_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw Error('VAULT_ENCRYPTION_KEY must contain 32 random bytes');
  return key;
}
export function encryptSecret(value) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm',encryptionKey(),iv);
  const encrypted = Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  return ['v1',iv.toString('base64'),cipher.getAuthTag().toString('base64'),encrypted.toString('base64')].join('.');
}
export function decryptSecret(value) {
  const [version,iv,tag,payload] = value.split('.');
  if (version !== 'v1') throw Error('Unknown secret format');
  const cipher = createDecipheriv('aes-256-gcm',encryptionKey(),Buffer.from(iv,'base64'));
  cipher.setAuthTag(Buffer.from(tag,'base64'));
  return Buffer.concat([cipher.update(Buffer.from(payload,'base64')),cipher.final()]).toString('utf8');
}
