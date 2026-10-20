// สร้างบัญชีผู้ใช้ (รวมผู้ดูแลระบบคนแรก):
//   NAME="ชื่อ" EMAIL=a@b.com PASSWORD=รหัสอย่างน้อย8ตัว ROLE=admin node --env-file=.env scripts/create-user.js
// ROLE: admin | team_leader | technician | customer (customer ต้องมี CUSTOMER_ID) · TEAM ใช้กับช่างและหัวหน้าทีม
// ใส่รหัสทาง environment ไม่ใช่ argument เพื่อไม่ให้รหัสไปติดในประวัติคำสั่ง
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { hashPassword } from '../auth.js';

const ROLES = ['admin', 'team_leader', 'technician', 'customer'];
const { NAME = '', EMAIL = '', PASSWORD = '', ROLE = '', TEAM = '', CUSTOMER_ID = '' } = process.env;
const name = NAME.trim();
const email = EMAIL.trim().toLowerCase();

const fail = msg => { console.error(msg); process.exit(1); };
if (!name || name.length > 100) fail('ต้องระบุ NAME (ไม่เกิน 100 ตัวอักษร)');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 100) fail('EMAIL ไม่ถูกต้อง');
if (PASSWORD.length < 8) fail('PASSWORD ต้องยาวอย่างน้อย 8 ตัว');
if (!ROLES.includes(ROLE)) fail(`ROLE ต้องเป็นหนึ่งใน ${ROLES.join(' | ')}`);
if (ROLE === 'customer' && !CUSTOMER_ID) fail('ROLE=customer ต้องระบุ CUSTOMER_ID');

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const { rows: [dup] } = await pool.query('select 1 from users where email = $1', [email]);
  if (dup) fail('มีบัญชีที่ใช้อีเมลนี้อยู่แล้ว');
  const id = `u${randomBytes(4).toString('hex')}`;
  await pool.query(
    `insert into users (id, name, role, email, team, customer_id, password_hash)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [id, name, ROLE, email, TEAM.trim() || null, ROLE === 'customer' ? CUSTOMER_ID : null, await hashPassword(PASSWORD)]);
  console.log(`สร้างบัญชีแล้ว: ${email} (${ROLE})`);
} catch (err) {
  // เช่น CUSTOMER_ID ที่ไม่มีอยู่จริง (foreign key) — แสดงสาเหตุ ไม่ปล่อยให้พังเงียบ
  fail(`สร้างบัญชีไม่สำเร็จ: ${err.message}`);
} finally {
  await pool.end();
}
