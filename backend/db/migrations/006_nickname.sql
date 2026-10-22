-- ชื่อเล่น (แสดงแทนชื่อเต็มในที่แคบ) — รันด้วยบัญชี postgres ใน pgAdmin
alter table users add column if not exists nickname text;
