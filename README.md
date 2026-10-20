# Guru IT Service Desk

ระบบแจ้งปัญหาไอที ติดตามงาน และเซ็นรับงาน ของ Guru IT Solution

## โครงสร้างโปรเจค

```
guru-service-desk/
├── frontend/      หน้าเว็บ Next.js (App Router, JavaScript) — ดู frontend/README.md
├── backend/       API ต่อ PostgreSQL (Node.js) — ดู backend/README.md
├── db/            ร่างโครงสร้างฐานข้อมูลเดิม (schema จริงอยู่ที่ backend/db/)
├── index.html, js/, css/, img/   แอปเดิมแบบไฟล์นิ่ง (localStorage) ยังใช้งานได้จนกว่าจะพอร์ตครบ
└── manifest.webmanifest
tools/             สคริปต์ช่วยรันและบันทึกอัตโนมัติ
```

## รันระบบใหม่บนเครื่องพัฒนา

1. ติดตั้ง Node.js LTS และ PostgreSQL 17
2. สร้างฐานข้อมูลและตาราง ตามที่ `guru-service-desk/backend/README.md`
3. รัน backend (พอร์ต 4000) และ frontend (พอร์ต 3000) ตามคู่มือในโฟลเดอร์นั้น

## ความปลอดภัย

- รหัสผ่านฐานข้อมูลและ `backend/.env` ไม่ถูกเก็บใน git
- ระบบยังไม่มี HTTPS และยังไม่จำกัดการลองรหัสผิด ต้องเพิ่มก่อนเปิดใช้งานนอกเครื่องนี้
