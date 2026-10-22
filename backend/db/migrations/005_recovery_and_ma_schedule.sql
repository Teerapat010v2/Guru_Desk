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
