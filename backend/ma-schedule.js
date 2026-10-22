// กติกาวันที่ของงาน MA ประจำเดือน — แยกเป็นโมดูลเพื่อทดสอบได้ (ดู ma-schedule.test.js)
// วันที่ตั้งไว้ไม่มีในเดือนนั้น (เช่น 31 ในเดือน 30 วัน หรือ 30 ใน ก.พ.) → ใช้วันสุดท้ายของเดือน

export const daysInMonth = (year, month0) => new Date(year, month0 + 1, 0).getDate();
export const dueDay = (year, month0, dom) => Math.min(dom, daysInMonth(year, month0));
export const monthKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const iso = (y, m0, d) => `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// วันที่ถึงกำหนดของเดือนที่ now อยู่ (YYYY-MM-DD)
export const dueDateThisMonth = (now, dom) => iso(now.getFullYear(), now.getMonth(), dueDay(now.getFullYear(), now.getMonth(), dom));

// ครั้งถัดไป: ถ้าเดือนนี้ยังไม่ได้สร้างงาน (ไม่มี run ของเดือนนี้) = วันกำหนดของเดือนนี้ (อาจผ่านมาแล้วและรอระบบสร้าง) ไม่งั้นเป็นของเดือนหน้า
export function nextDueDate(now, dom, lastYm) {
  if (lastYm !== monthKey(now)) return dueDateThisMonth(now, dom);
  const n = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return iso(n.getFullYear(), n.getMonth(), dueDay(n.getFullYear(), n.getMonth(), dom));
}

// ถึงเวลาสร้างงานของเดือนนี้หรือยัง: วันนี้ >= วันกำหนด (เซิร์ฟเวอร์ปิดอยู่ในวันกำหนดก็สร้างให้ทีหลังภายในเดือนเดียวกัน)
export const isDue = (now, dom) => now.getDate() >= dueDay(now.getFullYear(), now.getMonth(), dom);
