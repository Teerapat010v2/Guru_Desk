// ส่งอีเมลผ่าน SMTP ใน .env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
// ยังไม่ตั้งค่า SMTP_HOST = ไม่ส่งและไม่ทำให้งานหลักล้ม
import nodemailer from 'nodemailer';

const transport = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), requireTLS: true,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null;
const from = () => process.env.MAIL_FROM || process.env.SMTP_USER;

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- ใบรายงานเมื่อลูกค้าเซ็นรับ ----------
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
  await transport.sendMail({ from: from(), to, ...reportMail(report) });
  return true;
}

// ---------- นัดหมายงาน: คำเชิญปฏิทิน (.ics) เข้า Outlook พร้อมเตือน เหมือนที่หัวหน้าส่งให้ช่างเดิม ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th');
const ical = s => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
// เวลาไทย (UTC+7 ไม่มีเวลาออมแสง) → UTC เพื่อไม่ต้องใส่ VTIMEZONE
const utc = (date, hm) => {
  const [y, m, d] = date.split('-').map(Number), [h, mi] = hm.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - 7, mi)).toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
};

// info: { ticketId, subject, customer, contract, address, date 'YYYY-MM-DD', from 'HH:MM', to 'HH:MM' }
export function scheduleMail(info, attendee) {
  const [y, m, d] = info.date.split('-').map(Number);
  const dayName = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const kind = info.contract === 'ma' ? 'IT Maintenance Onsite' : 'IT Service Onsite';
  const title = `${kind} ${info.customer} on ${d} ${MONTHS[m - 1]} ${y}`;
  const intro = info.contract === 'ma'
    ? 'Kindly note our engineer will attend your office as per regular IT MA on the following date.'
    : `Kindly note our engineer will attend your office on the following date for: ${info.subject}`;
  const when = `${dayName} ${ordinal(d)} ${MONTHS[m - 1]} ${y}, ${info.from}–${info.to}`;
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Guru IT Service Desk//TH', 'METHOD:REQUEST', 'BEGIN:VEVENT',
    `UID:${info.ticketId}@guru-service-desk`,
    `DTSTAMP:${stamp}`, `SEQUENCE:${Math.floor(Date.now() / 1000)}`,   // เลขเพิ่มขึ้นทุกครั้ง Outlook จึงแทนนัดเดิมเมื่อแก้วันเวลา
    `DTSTART:${utc(info.date, info.from)}`, `DTEND:${utc(info.date, info.to)}`,
    `SUMMARY:${ical(title)}`,
    `DESCRIPTION:${ical(`${intro}\n${when}\n${info.subject}`)}`,
    info.address ? `LOCATION:${ical(info.address)}` : null,
    from() ? `ORGANIZER:mailto:${from()}` : null,
    attendee ? `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${attendee}` : null,
    'STATUS:CONFIRMED', 'BEGIN:VALARM', 'TRIGGER:-PT1H', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');
  return {
    subject: title,
    html: `<div style="font-family:sans-serif;color:#18212d"><p>Dear All,</p><p>${esc(intro)}</p>
      <p><b>${esc(when)}</b></p><p>${esc(info.subject)}</p>
      <p style="color:#5f6875;font-size:12px">Sent automatically by Guru IT Service Desk</p></div>`,
    ics,
  };
}

export async function sendScheduleMail(to, info) {
  if (!transport || !to) return false;
  const { ics, ...m } = scheduleMail(info, to);
  await transport.sendMail({ from: from(), to, ...m, icalEvent: { method: 'REQUEST', content: ics } });
  return true;
}
