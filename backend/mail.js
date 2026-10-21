// ส่งอีเมลใบรายงานให้ลูกค้าเมื่อปิดงาน (เซ็นรับ) ผ่าน SMTP ใน .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
// ยังไม่ตั้งค่า SMTP_HOST = ไม่ส่งและไม่ทำให้การปิดงานล้ม
import nodemailer from 'nodemailer';

const transport = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// สร้างเนื้อหาอีเมล (แยกออกมาเพื่อทดสอบได้โดยไม่ต้องส่งจริง)
export function reportMail({ no, subject, summary, parts, hours, signName }) {
  return {
    subject: `ใบรายงาน ${no} — ${subject}`,
    html: `<div style="font-family:sans-serif;color:#18212d">
      <h2 style="margin:0 0 8px">ใบรายงานการปฏิบัติงาน ${esc(no)}</h2>
      <p style="margin:0 0 12px">งาน: ${esc(subject)}</p>
      <p><b>สรุปงานที่ทำ</b><br>${esc(summary).replace(/\n/g, '<br>')}</p>
      ${parts ? `<p><b>อุปกรณ์ / อะไหล่</b><br>${esc(parts)}</p>` : ''}
      <p><b>เวลาที่ใช้</b> ${Number(hours)} ชั่วโมง</p>
      <p><b>ผู้รับงาน</b> ${esc(signName)}</p>
      <p style="color:#5f6875;font-size:12px">อีเมลนี้ส่งอัตโนมัติจาก Guru IT Service Desk</p></div>`,
  };
}

export async function sendReportMail(to, report) {
  if (!transport || !to) return false;
  const m = reportMail(report);
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, ...m });
  return true;
}

// นัดหมายงาน: ส่งให้ลูกค้าและช่างที่รับงานเมื่อวางแผนวันเวลาในปฏิทิน
export function scheduleMail({ subject, date, from, to, role }) {
  return {
    subject: `นัดหมายงาน ${subject} — ${date} ${from}–${to}`,
    html: `<div style="font-family:sans-serif;color:#18212d">
      <h2 style="margin:0 0 8px">${role === 'customer' ? 'นัดหมายการเข้าบริการ' : 'คุณมีนัดหมายงานใหม่'}</h2>
      <p><b>งาน</b> ${esc(subject)}</p>
      <p><b>วันที่</b> ${esc(date)}</p>
      <p><b>เวลา</b> ${esc(from)} – ${esc(to)} น.</p>
      <p style="color:#5f6875;font-size:12px">อีเมลนี้ส่งอัตโนมัติจาก Guru IT Service Desk</p></div>`,
  };
}

export async function sendScheduleMail(to, info) {
  if (!transport || !to) return false;
  await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, ...scheduleMail(info) });
  return true;
}
