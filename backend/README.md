# backend — API ของ Guru IT Service Desk

Node.js (ไม่มี framework) ต่อ PostgreSQL ด้วยไลบรารี `pg`

## ไฟล์

- `server.js` — เส้นทาง API ทั้งหมด
- `rules.js` — กติกาสถานะและสิทธิ์ (ตรวจทุกการกระทำฝั่ง server)
- `auth.js` — แฮชรหัสผ่าน (scrypt) และโทเคนของ session
- `db/schema.sql` — โครงสร้างตาราง (รวม sessions, password_hash, report_seq)
- `scripts/setup-db.ps1` — ตั้งค่าฐานข้อมูล ผู้ใช้ของแอป และ .env ในคำสั่งเดียว
- `scripts/create-user.ps1` / `create-user.js` — สร้างบัญชี (รวมผู้ดูแลระบบคนแรก)
- `scripts/set-password.js` — เปลี่ยนรหัสผ่านของบัญชีที่มีอยู่

## ตั้งค่า

1. ตั้งค่าฐานข้อมูล (PostgreSQL 18 พอร์ต 5434) ด้วยคำสั่งเดียว — ถามรหัส `postgres` ครั้งเดียว แล้วสร้างฐานข้อมูล `guru_desk`
   โหลด `db/schema.sql` สร้างผู้ใช้ `guru_app` (อ่าน/เขียนข้อมูลได้ แต่สร้างหรือลบตารางไม่ได้) และเขียน `.env` ให้เอง รันซ้ำได้ ข้อมูลเดิมไม่หาย:
   ```
   powershell -ExecutionPolicy Bypass -File scripts\setup-db.ps1
   ```
2. สร้างบัญชีผู้ดูแลระบบคนแรก (ถามชื่อ อีเมล บทบาท และรหัสผ่านทีละข้อ):
   ```
   powershell -ExecutionPolicy Bypass -File scripts\create-user.ps1
   ```
   หรือแบบตัวแปร: `NAME=... EMAIL=... PASSWORD=... ROLE=admin node --env-file=.env scripts/create-user.js`
   (`ROLE` เป็น `admin | team_leader | technician | customer` ลูกค้าต้องมี `CUSTOMER_ID` ช่างและหัวหน้าทีมใส่ `TEAM` ได้)
3. เปลี่ยนรหัสผ่านของบัญชีที่มีอยู่:
   ```
   PASSWORD=... node --env-file=.env scripts/set-password.js <email>
   ```

## รัน

```
node --env-file=.env server.js
```

พอร์ตเริ่มต้น 4000 (เปลี่ยนได้ด้วยตัวแปร `PORT`)

## เส้นทาง API

| เมธอด | เส้นทาง | ใช้ทำอะไร |
|---|---|---|
| GET | `/api/health` | ตรวจว่า backend ต่อฐานข้อมูลได้ |
| POST | `/api/login` | เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน ได้ cookie session |
| POST | `/api/logout` | ออกจากระบบ |
| GET | `/api/me` | ผู้ใช้ที่เข้าสู่ระบบอยู่ |
| GET | `/api/state` | ข้อมูลทั้งหมดที่ผู้ใช้มีสิทธิ์เห็น (งาน ผู้ใช้ บริษัท สถานที่ บันทึกตรวจสอบ) ในรูปแบบที่หน้าเว็บใช้ |
| POST | `/api/tickets` | เปิดงานใหม่: ลูกค้า (บริษัทตัวเอง เล่าปัญหาช่องเดียว) หรือหัวหน้าทีม/ผู้ดูแล (กรอกครบ) · ช่างเปิดไม่ได้ |
| POST | `/api/tickets/:id/status` | เปลี่ยนสถานะ (ไม่รับ resolved) · ลูกค้าส่งงานที่รอเซ็นรับกลับให้ช่างได้ (ต้องบอกเหตุผล) |
| POST | `/api/tickets/:id/assign` | มอบหมายช่าง |
| POST | `/api/tickets/:id/resolve` | ทำเสร็จพร้อมใบรายงาน |
| POST | `/api/tickets/:id/signoff` | ลงนามรับงาน (ลายเซ็นต้องเป็นไฟล์ PNG จริง) |
| POST | `/api/tickets/:id/rating` | ให้คะแนน 1–5 |
| POST | `/api/tickets/:id/comments` | ส่งความเห็น (ลูกค้าโพสต์ได้เฉพาะสาธารณะ) |
| POST | `/api/tickets/:id/worklog` | บันทึก work log (เฉพาะช่างที่รับผิดชอบ) |
| POST | `/api/users` | เพิ่มบัญชีพร้อมรหัสผ่านเริ่มต้น (ผู้ดูแล: ทุกบทบาท · หัวหน้าทีม: เฉพาะช่าง · ตัวแทนบริษัท: พนักงานของบริษัทตัวเองเท่านั้น) |
| POST | `/api/users/:id` | แก้ไข ตั้งรหัสใหม่ (ออกจากระบบทุกเครื่องของคนนั้น) ปิด/เปิดบัญชี · แก้บทบาทหรือปิดบัญชีตัวเองไม่ได้ |
| POST | `/api/customers` | เพิ่มพาร์ทเนอร์พร้อมสถานที่แรก และบัญชีตัวแทนบริษัท (ถ้าระบุ) — หัวหน้าทีม/ผู้ดูแล |
| POST | `/api/customers/:id` | แก้ไขพาร์ทเนอร์ |
| POST | `/api/customers/:id/sites` | เพิ่มสถานที่ · `/sites/:sid` = แก้ไขสถานที่ |

## ขึ้นโดเมน (ทำก่อนเปิดสู่อินเทอร์เน็ต)

- ใส่ `COOKIE_SECURE=1` ใน `.env` เมื่อเข้าผ่าน HTTPS เพื่อให้คุกกี้เข้าได้เฉพาะ HTTPS
- ให้ reverse proxy (เช่น Caddy หรือ nginx) รับ HTTPS ที่พอร์ต 443 แล้วส่งต่อไปที่ http://localhost:3000 (เว็บ) — `/api` ส่งต่อให้ backend ภายในเครื่องอยู่แล้ว
- สำรองฐานข้อมูล (ทำก่อนทุกครั้งที่อัปเดต): ในโฟลเดอร์ backend รัน powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1 ไฟล์จะอยู่ในโฟลเดอร์ backups เก็บล่าสุด 14 ไฟล์

## ข้อจำกัดที่ยังมี

- ใส่รหัสผิดติดกัน 10 ครั้งต่ออีเมลจะถูกล็อก จนกว่า server จะรีสตาร์ท (ยังไม่มีหน้าปลดล็อก)
- ยังไม่มี HTTPS ในตัว — ต้องใช้ reverse proxy ด้านบน
- ยังไม่มีการตั้งค่าให้ backend กับ frontend เปิดเองตอนเปิดเครื่อง
- ตรวจแค่รูปแบบของลายเซ็น ไม่ได้ตรวจเนื้อภาพ

## ข้อมูลตัวอย่าง

```
node --env-file=.env scripts/seed-demo.js           # เพิ่มบริษัท/งาน/โปรเจกต์/แจ้งเตือนตัวอย่าง (รันซ้ำได้)
node --env-file=.env scripts/seed-demo.js --clear   # ลบทั้งหมดที่สคริปต์นี้สร้าง — ต้องรันก่อนใช้งานจริง
```

ใช้กับบัญชีทดสอบ `demo-*@example.test` ที่มีอยู่ นัดหมายและรูปแบบงานจะถูกใส่เมื่อรัน migration 002/003 แล้ว

## ลืมรหัสผ่านและตารางงาน MA (ต้องรัน migration 005)

- ตัวแปรใน `.env`: `SMTP_HOST` `SMTP_PORT` `SMTP_USER` `SMTP_PASS` `MAIL_FROM` (ส่งอีเมล) และ `APP_URL` (ที่อยู่เว็บที่ใช้ทำลิงก์รีเซ็ต เช่น https://desk.example.com) — ไม่ตั้ง SMTP = ลิงก์ไม่ถูกส่ง (หน้าเว็บยังตอบเหมือนเดิม) ให้ผู้ใช้ใช้ช่องทางติดต่อผู้ดูแลระบบแทน
- ช่องทางติดต่อผู้ดูแลระบบที่แสดงในหน้า "ลืมรหัสผ่าน": แก้ค่า `SUPPORT` ใน `frontend/public/js/app.js`
- ตารางงาน MA: server สร้างงานให้เองตอนเริ่มและทุกชั่วโมง (ไม่ต้องเปิดเบราว์เซอร์) กันซ้ำด้วย `ma_runs` (ตาราง, เดือน) · เดือนที่ไม่มีวันที่ตั้งไว้ใช้วันสุดท้ายของเดือน · ทดสอบกติกาวันที่: `node ma-schedule.test.js`
