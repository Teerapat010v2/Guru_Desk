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
| GET | `/api/home` | รายการงานตามบทบาท |
| GET | `/api/tickets/:id` | รายละเอียดงาน พร้อมสิทธิ์การกระทำของผู้ใช้ |
| POST | `/api/tickets/:id/status` | เปลี่ยนสถานะ (ไม่รับ resolved) |
| POST | `/api/tickets/:id/assign` | มอบหมายช่าง |
| POST | `/api/tickets/:id/resolve` | ทำเสร็จพร้อมใบรายงาน |
| POST | `/api/tickets/:id/signoff` | ลงนามรับงาน (ลายเซ็นต้องเป็นไฟล์ PNG จริง) |
| POST | `/api/tickets/:id/rating` | ให้คะแนน 1–5 |
| POST | `/api/tickets/:id/comments` | ส่งความเห็น (ลูกค้าโพสต์ได้เฉพาะสาธารณะ) |
| POST | `/api/tickets/:id/worklog` | บันทึก work log (เฉพาะช่างที่รับผิดชอบ) |

## ข้อจำกัดที่ยังมี

- ยังไม่มี HTTPS (cookie ไม่ตั้ง `Secure`)
- ยังไม่จำกัดการลองรหัสผิดซ้ำ
- ตรวจแค่รูปแบบของลายเซ็น ไม่ได้ตรวจเนื้อภาพ
