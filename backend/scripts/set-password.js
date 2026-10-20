// ตั้งรหัสผ่านให้บัญชี: PASSWORD=... node --env-file=.env scripts/set-password.js <email>
// ใส่รหัสทาง environment ไม่ใช่ argument เพื่อไม่ให้รหัสไปติดในประวัติคำสั่ง
import pg from 'pg';
import { hashPassword } from '../auth.js';

const email = String(process.argv[2] ?? '').trim().toLowerCase();
const password = process.env.PASSWORD ?? '';
if (!email || password.length < 8) {
  console.error('ใช้: PASSWORD=รหัสอย่างน้อย8ตัว node --env-file=.env scripts/set-password.js <email>');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const { rowCount } = await pool.query(
  'update users set password_hash = $1 where email = $2 and removed = false',
  [await hashPassword(password), email],
);
console.log(rowCount ? 'ตั้งรหัสผ่านแล้ว' : 'ไม่พบบัญชีนี้');
await pool.end();
