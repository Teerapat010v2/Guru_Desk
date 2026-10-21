/* ข้อมูลระบบ — งาน ลูกค้า สถานที่ และผู้ใช้มาจากฐานข้อมูลจริงผ่าน js/api.js (ไม่เก็บในเครื่อง)
   ส่วนที่ยังไม่ได้เชื่อมฐานข้อมูล (โปรเจกต์ ภารกิจ แจ้งเตือน คำขอสมัคร บันทึกตรวจสอบ) ยังเก็บในเบราว์เซอร์เครื่องนี้ (คีย์ gitsd-local) */
// shortcut: ส่วนที่เก็บในเครื่องยังไม่แชร์ข้ามเครื่อง — ย้ายเข้า backend ทีละส่วน (ตาราง projects / notifications / join_requests / audit_log มีอยู่แล้ว)
const DAY = 86400;
const YEAR = new Date().getFullYear();
const DB_KEY = 'gitsd-local';
const ISO_DATE = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/;
const reviveDates = (k, v) => typeof v === 'string' && ISO_DATE.test(v) ? new Date(v) : v;
console.assert(JSON.parse(JSON.stringify({ at: new Date(0) }), reviveDates).at instanceof Date && JSON.parse('{"x":"2026"}', reviveDates).x === '2026', 'reviveDates');
const db0 = (() => { try { return JSON.parse(localStorage.getItem(DB_KEY), reviveDates) || {}; } catch { return {}; } })();

/* approver = ตัวแทนบริษัทลูกค้า ผู้อนุมัติพนักงานที่สมัครเข้ามา · skills = หมวดงานที่ช่างถนัด · phone = ใช้เข้าสู่ระบบ */
const users = {};

/* พาร์ทเนอร์ (ลูกค้าองค์กร) → สถานที่ที่เราดูแล */
const CONTRACT_LABEL = { ma: 'สัญญาดูแลรายปี (MA)', oncall: 'บริการรายครั้ง', project: 'งานโครงการ' };
const customers = {};
const teams = { T1: 'ทีมบริการภาคสนาม' };

const STATUS_FLOW = {
  new: ['assigned'], assigned: ['in_progress'], in_progress: ['pending', 'resolved'],
  pending: ['in_progress'], resolved: ['closed', 'in_progress'], closed: ['in_progress'],
};
const STATUS_LABEL = {
  new: 'ใหม่', assigned: 'มอบหมายแล้ว', in_progress: 'กำลังดำเนินการ',
  pending: 'พักงาน', resolved: 'รอลูกค้าเซ็นรับ', closed: 'ปิดงาน',
};
const PRIORITY_LABEL = { urgent: 'ด่วนมาก', high: 'สูง', medium: 'ปานกลาง', low: 'ต่ำ' };
const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };
/* ประเภทงาน (ไม่มี type = งานบริการ) — โปรเจกต์แยกเป็นข้อมูลของตัวเองใน projects */
const TYPE_LABEL = { service: 'งานบริการ', complaint: 'ร้องเรียน' };

/* ภาษาที่ลูกค้าเข้าใจ: ย่อ 6 สถานะเหลือ 4 ขั้น */
const CUST_STEPS = ['รับเรื่อง', 'มอบหมายช่าง', 'กำลังแก้ไข', 'เสร็จสิ้น'];
const CUST_STAGE = { new: 0, assigned: 1, in_progress: 2, pending: 2, resolved: 3, closed: 3 };
const CUST_STATUS = {
  new: 'ได้รับเรื่องแล้ว', assigned: 'มอบหมายช่างแล้ว', in_progress: 'ช่างกำลังแก้ไข',
  pending: 'รอดำเนินการ', resolved: 'รอคุณยืนยันงาน', closed: 'เสร็จสิ้น',
};

const CATEGORIES = {
  printer: { label: 'เครื่องพิมพ์', icon: 'print' },
  network: { label: 'อินเทอร์เน็ต/เครือข่าย', icon: 'wifi' },
  account: { label: 'บัญชี/รหัสผ่าน', icon: 'key' },
  install: { label: 'ติดตั้งเครื่อง', icon: 'pc' },
  repair:  { label: 'ซ่อมอุปกรณ์', icon: 'tool' },
  cctv:    { label: 'กล้องวงจรปิด', icon: 'cctv' },
  other:   { label: 'อื่น ๆ', icon: 'help' },
};

const ROLE_LABEL = { customer: 'ลูกค้า', technician: 'ช่างเทคนิค', team_leader: 'หัวหน้าทีม', admin: 'ผู้ดูแลระบบ' };
const ROLE_ORDER = ['customer', 'technician', 'team_leader', 'admin'];
const ROLE_META = {
  customer: {
    icon: 'user', goal: 'แจ้งปัญหา ติดตามงาน และเซ็นรับงาน',
    can: ['แจ้งปัญหา (พิมพ์ / พูด / แนบรูป)', 'ติดตามว่าช่างถึงไหนแล้ว', 'เซ็นรับงานและให้คะแนน'],
    cannot: ['เห็นบันทึกภายใน / Work log', 'เปลี่ยนสถานะงาน', 'เห็นตำแหน่งช่าง'],
  },
  technician: {
    icon: 'tool', goal: 'ทำงานที่ได้รับมอบหมายให้เสร็จ',
    can: ['เปลี่ยนสถานะงานของตัวเอง', 'ออกใบรายงานเมื่อทำเสร็จ', 'ให้ลูกค้าเซ็นรับงานหน้างาน', 'บันทึก Work log'],
    cannot: ['เห็นงานของช่างคนอื่น', 'มอบหมายงาน', 'จัดการพาร์ทเนอร์'],
  },
  team_leader: {
    icon: 'team', goal: 'กระจายงานและดูแลทีมให้ทันเวลา',
    can: ['เห็นงานทั้งหมด', 'มอบหมาย / ย้ายงาน', 'จัดการพาร์ทเนอร์และสถานที่', 'ดู / พิมพ์รายงานสรุป'],
    cannot: ['จัดการผู้ใช้และสิทธิ์'],
  },
  admin: {
    icon: 'gear', goal: 'ดูแลระบบ ผู้ใช้ และสิทธิ์',
    can: ['เห็นงานทั้งหมด', 'จัดการพาร์ทเนอร์และสถานที่', 'ดู / พิมพ์รายงานสรุป', 'ดูผู้ใช้และตารางสิทธิ์'],
    cannot: ['ดูตำแหน่ง GPS ของช่าง (ความเป็นส่วนตัว)'],
  },
};

let tickets = [];

/* รูปภาพแนบ/รูปโปรไฟล์: dataURL (ย่อขนาดแล้ว) อ้างอิงด้วย id เพื่อไม่ให้ HTML หนัก */
const PHOTOS = db0.PHOTOS || {};
let nextPhotoNo = db0.nextPhotoNo || 1;
const RATE_LABEL = ['', 'ต้องปรับปรุง', 'พอใช้', 'ปานกลาง', 'ดี', 'ดีมาก'];

/* โปรเจกต์ (งานติดตั้งหลายขั้นตอน) — ความคืบหน้า = งานย่อยที่เสร็จ / ทั้งหมด */
let projects = db0.projects || [];
let nextProjectNo = db0.nextProjectNo || 1;

/* การแจ้งเตือน: ส่งถึงผู้ใช้แต่ละคน (to) — แสดงในกระดิ่ง + แจ้งเตือนของเครื่องเมื่อคนนั้นเปิดแอป */
let notifs = db0.notifs || [];
let nextNotifNo = db0.nextNotifNo || 1;

/* คำขอสมัครใช้งานจากลิงก์ชวน (?join=รหัสบริษัท) — รอตัวแทนบริษัทอนุมัติ */
let joinRequests = db0.joinRequests || [];
let nextJoinNo = db0.nextJoinNo || 1, nextUserNo = 1;   // nextUserNo: ใช้ตอนอนุมัติคำขอสมัคร (ยังไม่เชื่อมฐานข้อมูล)

let missions = db0.missions || {};

let auditLog = [];   // มาจาก server (audit_log) ตอนโหลดข้อมูล — เห็นเฉพาะหัวหน้าทีม/ผู้ดูแล
function logAudit(u, action, detail) { auditLog.unshift({ at: new Date(), actor: u.name, role: u.role, action, detail }); }

/* บันทึกส่วนที่ยังอยู่ในเครื่องเท่านั้น (งาน/ลูกค้า/ผู้ใช้ อยู่ในฐานข้อมูลแล้ว ไม่เก็บซ้ำในเครื่อง) — คืน false ถ้าพื้นที่เต็ม */
let lastSaved = null;
function saveDb() {
  const s = JSON.stringify({ missions, PHOTOS: Object.fromEntries(Object.entries(PHOTOS).filter(([k]) => !k.includes(':'))),
    nextPhotoNo, nextProjectNo, nextNotifNo, nextJoinNo });
  if (s === lastSaved) return true;   // ไม่มีอะไรเปลี่ยน ไม่ต้องเขียนซ้ำ
  try { localStorage.setItem(DB_KEY, s); lastSaved = s; return true; } catch { return false; }
}

/* ตัวช่วยอ่านข้อมูล */
const custName = id => customers[id]?.name || '-';
const siteOf = tk => customers[tk.customer]?.sites.find(s => s.id === tk.siteId);
const siteLabel = tk => { const s = siteOf(tk); return (s ? s.name : '-') + (tk.location ? ` · ${tk.location}` : ''); };
const siteById = id => allSites().find(s => s.id === id);
const allSites = () => Object.values(customers).flatMap(c => c.sites.map(s => ({ ...s, customer: c.id })));
