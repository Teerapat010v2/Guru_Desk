/* ข้อมูลจำลองสำหรับดูทุกหน้า — ใช้เมื่อเปิด ?demo=1 และเครื่องนี้ยังไม่มีข้อมูลเท่านั้น (ไม่ทับข้อมูลจริง)
   ลบข้อมูลทดลอง: ลบไฟล์นี้และบรรทัด <script src="js/demo.js"> ในหน้า index.html */
(function () {
  if (new URLSearchParams(location.search).get('demo') !== '1') return;
  try { if (localStorage.getItem('gitsd-db')) return; } catch { return; }

  const at = s => new Date(Date.now() + s * 1000).toISOString();   // s ติดลบ = ย้อนหลังเป็นวินาที
  const DAY = 86400, YEAR = new Date().getFullYear();
  const sig = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path d="M15 70 C 35 20, 55 85, 80 45 S 120 75, 150 35 S 205 80, 235 40 L 285 55" stroke="#1F2937" stroke-width="3" fill="none" stroke-linecap="round"/></svg>');

  const users = {
    u1: { id: 'u1', name: 'แอดมินระบบ', role: 'admin', phone: '0840000001', email: 'admin@guru-itsolution.com' },
    u2: { id: 'u2', name: 'ประภาส', role: 'team_leader', team: 'T1', phone: '0830000001', email: 'lead@guru-itsolution.com' },
    tech1: { id: 'tech1', name: 'ชาติชาย', role: 'technician', team: 'T1', phone: '0820000001', email: 'tech1@guru-itsolution.com', skills: ['printer', 'repair', 'install'] },
    tech2: { id: 'tech2', name: 'วิภา', role: 'technician', team: 'T1', phone: '0820000002', email: 'tech2@guru-itsolution.com', skills: ['account', 'network'] },
    tech3: { id: 'tech3', name: 'สมชาย', role: 'technician', team: 'T1', phone: '0820000003', email: 'tech3@guru-itsolution.com', skills: ['cctv', 'network', 'install'] },
    m1: { id: 'm1', name: 'สมหญิง ใจดี', role: 'customer', customer: 'C1', siteId: 'S1', approver: true, phone: '0810000001', email: 'rep@abc.example' },
    m2: { id: 'm2', name: 'วรรณา ศรีสุข', role: 'customer', customer: 'C2', siteId: 'S3', approver: true, phone: '0810000002', email: 'rep@xyz.example' },
    m3: { id: 'm3', name: 'สุชาติ พนักงาน', role: 'customer', customer: 'C1', siteId: 'S1', phone: '0810000003', email: 'staff@abc.example' },
  };

  const customers = {
    C1: { id: 'C1', name: 'บริษัท เอบีซี จำกัด', contract: 'ma', contact: 'สมหญิง ใจดี', phone: '02-000-0001', email: 'it@abc.example', sites: [
      { id: 'S1', name: 'สำนักงานใหญ่', address: '99/1 ถนนสุขุมวิท แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพฯ 10110', contact: 'สมหญิง ใจดี', phone: '02-000-0001', lat: 13.738, lng: 100.56 },
      { id: 'S2', name: 'คลังสินค้าบางนา', address: '88 หมู่ 5 ถนนบางนา-ตราด สมุทรปราการ 10540', contact: 'ธนพล', phone: '02-000-0002', lat: 13.633, lng: 100.723 }] },
    C2: { id: 'C2', name: 'ร้านสะดวกซื้อ XYZ', contract: 'oncall', contact: 'วรรณา ศรีสุข', phone: '02-000-0101', email: 'admin@xyz.example', sites: [
      { id: 'S3', name: 'สาขาลาดพร้าว', address: '1234 ถนนลาดพร้าว กรุงเทพฯ 10900', contact: 'วรรณา ศรีสุข', phone: '02-000-0101', lat: 13.816, lng: 100.561 },
      { id: 'S4', name: 'สาขารัชดา', address: '55 ถนนรัชดาภิเษก กรุงเทพฯ 10400', contact: 'ผู้จัดการสาขา', phone: '02-000-0102', lat: 13.766, lng: 100.57 }] },
    C3: { id: 'C3', name: 'คลินิกทันตกรรมยิ้มสวย', contract: 'project', contact: 'ทพ.อรุณี', phone: '02-000-0201', email: 'contact@smile.example', sites: [
      { id: 'S5', name: 'คลินิกอารีย์', address: '7 ซอยอารีย์ 1 กรุงเทพฯ 10400', contact: 'ทพ.อรุณี', phone: '02-000-0201', lat: 13.78, lng: 100.545 }] },
  };

  const tk = o => ({ location: '', missionId: null, comments: [], worklogs: [], report: null, rating: null, version: 1, ...o });
  const tickets = [
    tk({ id: 'T-1001', customer: 'C1', siteId: 'S1', location: 'ชั้น 3', subject: 'เครื่องพิมพ์ชั้น 3 ใช้งานไม่ได้', category: 'printer', priority: 'high', status: 'in_progress', assignee: 'tech1', version: 3,
      history: [{ from: null, to: 'new', by: 'm1', at: at(-7200) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-7000) }, { from: 'assigned', to: 'in_progress', by: 'tech1', at: at(-5400) }],
      comments: [{ by: 'm1', vis: 'public', text: 'ปริ้นเตอร์ไม่ตัดกระดาษ แจ้งตั้งแต่เมื่อวาน', at: at(-7190) }, { by: 'tech1', vis: 'internal', text: 'ลูกกลิ้งสึก ต้องสั่งอะไหล่', at: at(-5000) }],
      worklogs: [{ by: 'tech1', text: 'ตรวจเครื่อง พบลูกกลิ้งดึงกระดาษสึก', at: at(-5300) }] }),
    tk({ id: 'T-1002', customer: 'C1', siteId: 'S1', location: 'ฝ่ายบัญชี', subject: 'ขอรีเซ็ตรหัสผ่าน VPN', category: 'account', priority: 'medium', status: 'resolved', assignee: 'tech2', version: 4,
      history: [{ from: null, to: 'new', by: 'm1', at: at(-90000) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-89000) }, { from: 'assigned', to: 'in_progress', by: 'tech2', at: at(-88000) }, { from: 'in_progress', to: 'resolved', by: 'tech2', at: at(-3600), reason: 'รีเซ็ตรหัสผ่านและแจ้งผู้ใช้แล้ว' }],
      report: { no: `SR-${YEAR}-0003`, summary: 'รีเซ็ตรหัสผ่าน VPN ใน Active Directory และทดสอบการเชื่อมต่อกับผู้ใช้', parts: '', hours: 0.5, by: 'tech2', at: at(-3600), signoff: null } }),
    tk({ id: 'T-1003', customer: 'C2', siteId: 'S3', subject: 'เครือข่ายล่มทั้งสาขา', category: 'network', priority: 'urgent', status: 'new', assignee: null,
      history: [{ from: null, to: 'new', by: 'm2', at: at(-900) }], comments: [{ by: 'm2', vis: 'public', text: 'เน็ตใช้งานไม่ได้ทั้งร้าน ด่วนมากค่ะ', at: at(-900) }] }),
    tk({ id: 'T-1004', customer: 'C1', siteId: 'S2', location: 'ห้องธุรการ', subject: 'ติดตั้งคอมพิวเตอร์ใหม่ 3 เครื่อง', category: 'install', priority: 'low', status: 'pending', assignee: 'tech1', version: 2,
      history: [{ from: null, to: 'new', by: 'm1', at: at(-900 * 4) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-900 * 4 + 20) }, { from: 'assigned', to: 'in_progress', by: 'tech1', at: at(-500) }, { from: 'in_progress', to: 'pending', by: 'tech1', at: at(-60), reason: 'รออุปกรณ์จากคลังสินค้า' }] }),
    tk({ id: 'T-1005', customer: 'C2', siteId: 'S3', subject: 'อินเทอร์เน็ตช้ามากช่วงเที่ยง', category: 'network', priority: 'medium', status: 'assigned', assignee: 'tech2', version: 2,
      history: [{ from: null, to: 'new', by: 'm2', at: at(-3000) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-2000) }] }),
    tk({ id: 'T-0997', type: 'complaint', customer: 'C1', siteId: 'S2', subject: 'ช่างมาช้ากว่านัดเกือบ 2 ชั่วโมง ไม่มีใครโทรแจ้ง', category: 'other', priority: 'high', status: 'new', assignee: null,
      history: [{ from: null, to: 'new', by: 'm3', at: at(-3600) }], comments: [{ by: 'm3', vis: 'public', text: 'นัดไว้ 9 โมง ช่างมาเกือบ 11 โมง อยากให้โทรแจ้งก่อน', at: at(-3600) }] }),
    tk({ id: 'T-0998', customer: 'C1', siteId: 'S1', location: 'ห้องประชุมใหญ่', subject: 'โปรเจกเตอร์ห้องประชุมไม่มีสัญญาณภาพ', category: 'repair', priority: 'medium', status: 'closed', assignee: 'tech1', version: 6,
      history: [{ from: null, to: 'new', by: 'm1', at: at(-5 * DAY) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-5 * DAY + 600) }, { from: 'assigned', to: 'in_progress', by: 'tech1', at: at(-4 * DAY) }, { from: 'in_progress', to: 'resolved', by: 'tech1', at: at(-4 * DAY + 5400), reason: 'เปลี่ยนสาย HDMI' }, { from: 'resolved', to: 'closed', by: 'm1', at: at(-4 * DAY + 6000), reason: 'ลูกค้าลงนามรับงาน' }],
      report: { no: `SR-${YEAR}-0001`, summary: 'ตรวจระบบภาพ พบสาย HDMI ใต้พื้นชำรุด เปลี่ยนสายใหม่และทดสอบการแสดงผลจากโน้ตบุ๊ก 3 เครื่องเรียบร้อย', parts: 'สาย HDMI 15 ม. 1 เส้น', hours: 1.5, by: 'tech1', at: at(-4 * DAY + 5400),
        signoff: { name: 'สมหญิง ใจดี', position: 'เจ้าหน้าที่ไอที', via: 'app', by: 'm1', at: at(-4 * DAY + 6000), sig } },
      rating: { score: 5, comment: 'ช่างมาตรงเวลา อธิบายเข้าใจง่าย', by: 'm1', at: at(-4 * DAY + 6100) } }),
    tk({ id: 'T-0999', customer: 'C2', siteId: 'S4', location: 'จุดชำระเงิน 2', subject: 'เครื่อง POS ค้าง', category: 'repair', priority: 'high', status: 'closed', assignee: 'tech2', version: 6,
      history: [{ from: null, to: 'new', by: 'm2', at: at(-2 * DAY) }, { from: 'new', to: 'assigned', by: 'u2', at: at(-2 * DAY + 300) }, { from: 'assigned', to: 'in_progress', by: 'tech2', at: at(-2 * DAY + 3600) }, { from: 'in_progress', to: 'resolved', by: 'tech2', at: at(-2 * DAY + 9000), reason: 'ติดตั้งไดรเวอร์ใหม่' }, { from: 'resolved', to: 'closed', by: 'tech2', at: at(-2 * DAY + 9300), reason: 'ลูกค้าลงนามรับงานหน้างาน' }],
      report: { no: `SR-${YEAR}-0002`, summary: 'เครื่อง POS ค้างจากไดรเวอร์เครื่องพิมพ์ใบเสร็จ ติดตั้งไดรเวอร์ล่าสุดและทดสอบขาย 5 รายการ', parts: '', hours: 1.5, by: 'tech2', at: at(-2 * DAY + 9000),
        signoff: { name: 'กิตติ ทองดี', position: 'ผู้จัดการสาขา', via: 'onsite', by: 'tech2', at: at(-2 * DAY + 9300), sig } },
      rating: { score: 4, comment: '', by: 'tech2', via: 'onsite', at: at(-2 * DAY + 9350) } }),
  ];

  const projects = [
    { id: 'PJ1', name: 'ติดตั้งกล้องวงจรปิด 16 จุด', category: 'cctv', customer: 'C1', siteId: 'S2', owner: 'tech3', due: at(10 * DAY), createdAt: at(-6 * DAY),
      tasks: [{ text: 'สำรวจหน้างานและวางตำแหน่งกล้อง', done: true }, { text: 'เดินสาย LAN / ไฟ', done: true }, { text: 'ติดตั้งกล้อง 16 ตัว', done: false }, { text: 'ตั้งค่า NVR และแอปดูภาพ', done: false }] },
    { id: 'PJ2', name: 'ติดตั้ง Wi-Fi ทั้งสาขา', category: 'network', customer: 'C2', siteId: 'S4', owner: 'tech2', due: at(4 * DAY), createdAt: at(-3 * DAY),
      tasks: [{ text: 'สำรวจสัญญาณ', done: true }, { text: 'ติดตั้ง Access Point 4 ตัว', done: true }, { text: 'ทดสอบสัญญาณทุกจุด', done: false }] },
  ];

  const notifs = [
    { id: 'N1', to: 'u2', title: 'งานใหม่ · ด่วนมาก', body: 'เครือข่ายล่มทั้งสาขา — ร้านสะดวกซื้อ XYZ', ticketId: 'T-1003', at: at(-900), read: false },
    { id: 'N2', to: 'u1', title: 'งานใหม่ · ด่วนมาก', body: 'เครือข่ายล่มทั้งสาขา — ร้านสะดวกซื้อ XYZ', ticketId: 'T-1003', at: at(-900), read: false },
  ];
  const joinRequests = [{ id: 'J1', customer: 'C1', siteId: 'S1', name: 'ทดสอบ พนักงานใหม่', email: 'new@abc.example', phone: '0812345678', photo: null, at: at(-600), status: 'pending' }];
  const auditLog = [
    { at: at(-7000), actor: 'ประภาส', role: 'team_leader', action: 'มอบหมาย T-1001', detail: '→ ชาติชาย' },
    { at: at(-5300), actor: 'ชาติชาย', role: 'technician', action: 'เปลี่ยนสถานะ T-1001', detail: '→ กำลังดำเนินการ' },
  ];

  localStorage.setItem('gitsd-db', JSON.stringify({
    users, customers, tickets, projects, notifs, joinRequests, missions: {}, auditLog, PHOTOS: {},
    nextTechNo: 4, nextCustomerNo: 4, nextSiteNo: 6, nextTicketNo: 1006, nextReportNo: 4, nextPhotoNo: 1,
    nextProjectNo: 3, nextNotifNo: 3, nextJoinNo: 2, nextUserNo: 4,
  }));
})();
