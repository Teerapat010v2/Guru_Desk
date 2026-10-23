-- รวม migration 002–007 ไว้รันครั้งเดียวใน pgAdmin (Query Tool ของฐาน guru_desk ด้วยบัญชี postgres)
-- ทุกคำสั่งรันซ้ำได้ปลอดภัย (IF NOT EXISTS / DROP IF EXISTS) ถ้าเคยรันบางไฟล์แล้วก็ไม่เสียหาย

-- ===== 002_schedule.sql =====
-- วางแผนงานในปฏิทิน: วันที่และช่วงเวลาที่ทีมวางไว้ให้งาน (ตารางเดิมมีอยู่แล้ว เพิ่มคอลัมน์เท่านั้น)
-- รันด้วยผู้ใช้ postgres (เจ้าของฐานข้อมูล) ใน pgAdmin หรือ psql — แอปรันเองไม่ได้เพราะไม่มีสิทธิ์ ALTER
-- รันซ้ำได้ (ใช้ IF NOT EXISTS)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_on date;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_from time;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_to time;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_planned_range;
ALTER TABLE tickets ADD CONSTRAINT tickets_planned_range CHECK (planned_from IS NULL OR planned_to IS NULL OR planned_from < planned_to);
-- สิทธิ์ให้แอป (guru_app) ยังใช้ได้เหมือนเดิม เพราะเป็นการเพิ่มคอลัมน์ในตารางที่มีสิทธิ์อยู่แล้ว

-- ===== 003_work_mode.sql =====
-- 003: รูปแบบการทำงาน — ไปหน้างาน (onsite, ค่าเริ่มต้น) หรือรีโมท (remote)
-- รันในฐานข้อมูล guru_desk ด้วยสิทธิ์ postgres (แอป guru_app ไม่มีสิทธิ์ DDL)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS work_mode text NOT NULL DEFAULT 'onsite';
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_work_mode_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_work_mode_check CHECK (work_mode IN ('onsite','remote'));

-- ===== 004_ma_checklist.sql =====
-- 004: เช็กลิสต์งาน MA ในใบรายงาน (ฮาร์ดแวร์ + เครื่องผู้ใช้) เก็บเป็น JSON
-- รันในฐานข้อมูล guru_desk ด้วยสิทธิ์ postgres (แอป guru_app ไม่มีสิทธิ์ DDL)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS checklist jsonb;

-- ===== 005_recovery_and_ma_schedule.sql =====
-- 005: ลืมรหัสผ่าน (โทเคนรีเซ็ตใช้ครั้งเดียว หมดอายุ) + ตารางงาน MA ประจำเดือน
-- รันในฐานข้อมูล guru_desk ด้วยสิทธิ์ postgres (แอป guru_app ไม่มีสิทธิ์ DDL) — ถ้า role แอปชื่ออื่น ให้แก้ชื่อในบรรทัด GRANT

-- โทเคนรีเซ็ตรหัสผ่าน: เก็บเฉพาะแฮช ใช้ได้ครั้งเดียว (used_at) และมีวันหมดอายุ
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_resets_user_idx ON password_resets(user_id);

-- ตารางงาน MA ที่ซ้ำทุกเดือน: วันที่ของเดือน (เดือนที่ไม่มีวันนั้นใช้วันสุดท้ายของเดือน) ผู้รับผิดชอบ และเปิด/พัก
CREATE TABLE IF NOT EXISTS ma_schedules (
  id          bigserial PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id),
  site_id     text REFERENCES sites(id),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  start_time  time,
  priority    text NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
  assignee_id text REFERENCES users(id),
  active      boolean NOT NULL DEFAULT true,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- งานที่สร้างจากตารางแล้ว: (ตาราง, เดือน) ซ้ำไม่ได้ — กันสร้างงานซ้ำแม้เซิร์ฟเวอร์รีสตาร์ตหรือมีหลายตัวรัน
CREATE TABLE IF NOT EXISTS ma_runs (
  schedule_id bigint NOT NULL REFERENCES ma_schedules(id) ON DELETE CASCADE,
  ym          text   NOT NULL,                 -- เช่น 2026-10
  ticket_id   text   REFERENCES tickets(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (schedule_id, ym)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON password_resets, ma_schedules, ma_runs TO guru_app;
GRANT USAGE, SELECT ON SEQUENCE ma_schedules_id_seq TO guru_app;

-- ===== 006_nickname.sql =====
-- ชื่อเล่น (แสดงแทนชื่อเต็มในที่แคบ) — รันด้วยบัญชี postgres ใน pgAdmin
alter table users add column if not exists nickname text;

-- ===== 007_line.sql =====
-- ผูกบัญชีผู้ใช้กับ LINE (ส่งแจ้งเตือนเข้า LINE) — รันด้วยบัญชี postgres ใน pgAdmin
alter table users add column if not exists line_user_id text unique;
