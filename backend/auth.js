// รหัสผ่านและโทเคนของ session — ใช้ scrypt ของ Node (ไม่ต้องลงไลบรารีเพิ่ม)
import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';

const scryptP = promisify(scrypt);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptP(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const [kind, salt, key] = String(stored ?? '').split('$');
  if (kind !== 'scrypt' || !salt || !key) return false;
  const expected = Buffer.from(key, 'base64');
  const got = await scryptP(password, Buffer.from(salt, 'base64'), expected.length);
  return timingSafeEqual(got, expected);
}

// เก็บเฉพาะแฮชของโทเคน: ถ้าฐานข้อมูลรั่ว โทเคนที่ใช้ได้จริงก็ไม่หลุด
export const hashToken = token => createHash('sha256').update(token).digest('hex');
export const newToken = () => randomBytes(32).toString('base64url');
