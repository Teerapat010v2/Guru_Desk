-- ผูกบัญชีผู้ใช้กับ LINE (ส่งแจ้งเตือนเข้า LINE) — รันด้วยบัญชี postgres ใน pgAdmin
alter table users add column if not exists line_user_id text unique;
