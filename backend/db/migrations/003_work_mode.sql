-- 003: รูปแบบการทำงาน — ไปหน้างาน (onsite, ค่าเริ่มต้น) หรือรีโมท (remote)
-- รันในฐานข้อมูล guru_desk ด้วยสิทธิ์ postgres (แอป guru_app ไม่มีสิทธิ์ DDL)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS work_mode text NOT NULL DEFAULT 'onsite';
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_work_mode_check;
ALTER TABLE tickets ADD CONSTRAINT tickets_work_mode_check CHECK (work_mode IN ('onsite','remote'));
