-- 004: เช็กลิสต์งาน MA ในใบรายงาน (ฮาร์ดแวร์ + เครื่องผู้ใช้) เก็บเป็น JSON
-- รันในฐานข้อมูล guru_desk ด้วยสิทธิ์ postgres (แอป guru_app ไม่มีสิทธิ์ DDL)
ALTER TABLE reports ADD COLUMN IF NOT EXISTS checklist jsonb;
