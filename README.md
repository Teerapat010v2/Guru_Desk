# Guru IT Service Desk

ระบบแจ้งปัญหาไอที ติดตามงาน และเซ็นรับงาน ของ Guru IT Solution

## โครงสร้างโปรเจค

```
guru-service-desk/
├── frontend/      หน้าเว็บ Next.js (App Router, JavaScript) พอร์ต 3000 — ดู frontend/README.md
├── backend/       API ต่อ PostgreSQL (Node.js) พอร์ต 4000 — ดู backend/README.md
│   └── db/schema.sql   โครงสร้างฐานข้อมูล
└── tools/         สคริปต์บันทึกอัตโนมัติ (autosave.sh)
```

แอปเดิมแบบไฟล์นิ่ง (localStorage) ถูกลบออกแล้ว ดูย้อนหลังได้จาก tag `old-static-app`

## รันบนเครื่องนี้

1. ฐานข้อมูล: PostgreSQL 18 พอร์ต 5434 (บริการ Windows เปิดเองตอนเปิดเครื่อง) ตั้งค่าครั้งแรกตาม `backend/README.md`
2. backend: ในโฟลเดอร์ `backend` รัน `node --env-file=.env server.js`
3. frontend: ในโฟลเดอร์ `frontend` รัน `npm.cmd run build` แล้ว `npm.cmd run start`
4. เปิด http://localhost:3000

## ความปลอดภัย

- รหัสผ่านฐานข้อมูลและ `backend/.env` ไม่ถูกเก็บใน git
- ระบบยังไม่มี HTTPS และยังไม่จำกัดการลองรหัสผิด ต้องเพิ่มก่อนเปิดใช้งานนอกเครื่องนี้
