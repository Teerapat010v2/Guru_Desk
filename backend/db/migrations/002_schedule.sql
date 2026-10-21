-- วางแผนงานในปฏิทิน: วันที่และช่วงเวลาที่ทีมวางไว้ให้งาน (ตารางเดิมมีอยู่แล้ว เพิ่มคอลัมน์เท่านั้น)
-- รันด้วยผู้ใช้ postgres (เจ้าของฐานข้อมูล) ใน pgAdmin หรือ psql — แอปรันเองไม่ได้เพราะไม่มีสิทธิ์ ALTER
-- รันซ้ำได้ (ใช้ IF NOT EXISTS)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_on date;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_from time;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS planned_to time;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_planned_range;
ALTER TABLE tickets ADD CONSTRAINT tickets_planned_range CHECK (planned_from IS NULL OR planned_to IS NULL OR planned_from < planned_to);
-- สิทธิ์ให้แอป (guru_app) ยังใช้ได้เหมือนเดิม เพราะเป็นการเพิ่มคอลัมน์ในตารางที่มีสิทธิ์อยู่แล้ว
