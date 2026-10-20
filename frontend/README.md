# frontend — หน้าเว็บ Guru IT Service Desk (Next.js)

Next.js 16 (App Router, JavaScript) เรียก API ที่ `../backend`

## รัน

ต้องเปิด backend ที่พอร์ต 4000 ก่อน (ดู `../backend/README.md`)

```
npm install
npm run dev      # โหมดพัฒนา ที่ http://localhost:3000
npm run build    # ตรวจการ build
npm run start    # รันแบบ production หลัง build
```

`next.config.mjs` ส่งคำขอ `/api/*` ไปที่ backend พอร์ต 4000 เบราว์เซอร์จึงเรียกผ่านพอร์ต 3000 เดียว

## หน้าที่มี

- `/` — เข้าสู่ระบบ, งานของฉัน, รายละเอียดงาน (มอบหมาย เปลี่ยนสถานะ ทำเสร็จ ลงนาม ให้คะแนน ความเห็น work log), จัดการบัญชี (เฉพาะผู้ดูแลระบบ)
- `/report/[id]` — หน้าพิมพ์ใบรายงาน (พิมพ์เป็น A4 ได้)

หน้าอื่นของแอปเดิม (เปิดงานใหม่ ทีมช่าง พาร์ทเนอร์ รายงานผลงาน ภารกิจ โปรเจกต์ ภาษาอังกฤษ โหมดกลางคืน) ยังไม่ได้พอร์ตมา
ดูโค้ดเดิมได้จาก tag `old-static-app` เช่น `git show old-static-app:js/app.js`
