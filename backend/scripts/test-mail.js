// ทดสอบ SMTP: ส่งใบรายงานตัวอย่าง (มีเช็กลิสต์ MA) และคำเชิญปฏิทินไปที่อีเมลที่ระบุ
// ใช้: node --env-file=.env scripts/test-mail.js you@company.com
import { sendReportMail, sendScheduleMail } from '../mail.js';

const to = process.argv[2];
if (!to || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) { console.error('ใช้: node --env-file=.env scripts/test-mail.js you@company.com'); process.exit(1); }
if (!process.env.SMTP_HOST) { console.error('ยังไม่ได้ตั้ง SMTP_HOST ใน backend/.env'); process.exit(1); }

const tomorrow = new Date(Date.now() + 864e5 + 7 * 36e5).toISOString().slice(0, 10);
try {
  await sendReportMail(to, {
    no: 'TEST-0001', subject: 'ตรวจเช็ก MA ประจำเดือน (ทดสอบ)', summary: 'ตรวจอุปกรณ์ครบ ไม่พบปัญหา', parts: '-', hours: 1.5, signName: 'ผู้ทดสอบ',
    checklist: { hw: [{ item: 'Firewall', ok: true, note: '' }, { item: 'Server', ok: true, note: 'ปกติ' }], pc: [{ name: 'เครื่องทดสอบ', disk: true, win: true, virus: true }], notes: 'อีเมลทดสอบจากระบบ' },
  });
  console.log('ส่งใบรายงานตัวอย่างแล้ว →', to);
  await sendScheduleMail(to, { ticketId: 'TEST-0001', subject: 'ตรวจเช็ก MA (ทดสอบ)', customer: 'บริษัททดสอบ', contract: 'MA', address: '-', date: tomorrow, from: '09:00', to: '10:00' });
  console.log('ส่งคำเชิญปฏิทินแล้ว →', to, '(ควรขึ้นปุ่ม Accept ใน Outlook)');
} catch (err) {
  console.error('ส่งไม่สำเร็จ:', err.message);
  console.error('ตรวจ SMTP_HOST/PORT/USER/PASS และว่า Microsoft 365 เปิด SMTP AUTH ให้กล่องจดหมายนี้แล้ว');
  process.exit(1);
}
