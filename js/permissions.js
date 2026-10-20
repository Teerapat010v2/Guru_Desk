/* ตรวจสิทธิ์ (จำลองฝั่ง Server) — UI ใช้ฟังก์ชันเหล่านี้ทั้งหมด ไม่ตัดสินสิทธิ์เอง */
const isStaff = u => u.role !== 'customer';
const isManager = u => u.role === 'team_leader' || u.role === 'admin';

function visibleTickets(u) {
  if (isManager(u)) return tickets;
  if (u.role === 'technician') return tickets.filter(x => x.assignee === u.id);
  if (u.role === 'customer') return tickets.filter(x => x.customer === u.customer);
  return [];
}
function canSeeTicket(u, tk) { return !!tk && visibleTickets(u).some(x => x.id === tk.id); }
function canSeeComment(u, c) { return u.role === 'customer' ? c.vis === 'public' : true; }
function canComment(u, vis) { return vis === 'public' || isStaff(u); }
function canCreateTicket(u) { return u.role === 'customer' || isManager(u); }

/* การมอบหมายเป็นการกระทำแยก (ต้องเลือกช่าง) ไม่ใช่ปุ่มเปลี่ยนสถานะทั่วไป */
function canAssign(u, tk) { return isManager(u) && ['new', 'assigned', 'pending'].includes(tk.status); }
function assignableTechs(u) {
  return Object.values(users).filter(x => x.role === 'technician' && !x.removed && (u.role === 'admin' || x.team === u.team));
}
function canTransition(u, tk, to) {
  if (u.role === 'customer' || to === 'assigned') return false;
  if (!STATUS_FLOW[tk.status]?.includes(to)) return false;
  if (tk.status === 'closed' || tk.status === 'resolved') return isManager(u); // เปิดซ้ำ / ส่งกลับ / ปิดโดยไม่มีลายเซ็น
  if (u.role === 'technician') return tk.assignee === u.id;
  return true;
}

/* ใบรายงานและการเซ็นรับงาน */
function canResolveWithReport(u, tk) { return canTransition(u, tk, 'resolved'); }
function canSeeReport(u, tk) { return !!tk.report && canSeeTicket(u, tk); }
/* ลูกค้าเซ็นผ่านแอปของตัวเอง หรือช่างผู้รับผิดชอบยื่นเครื่องให้ลูกค้าเซ็นหน้างาน */
function canSignOff(u, tk) {
  if (tk.status !== 'resolved' || !tk.report || tk.report.signoff) return false;
  if (u.role === 'customer') return tk.customer === u.customer;
  if (u.role === 'technician') return tk.assignee === u.id;
  return false;
}
/* คะแนนความพึงพอใจ: ลูกค้าให้ได้ครั้งเดียวหลังเซ็นรับ หรือให้บนเครื่องช่างทันทีหลังเซ็นหน้างาน (ภายใน 15 นาที) */
function canRate(u, tk) {
  const so = tk.report?.signoff;
  if (tk.status !== 'closed' || !so || tk.rating) return false;
  if (u.role === 'customer') return tk.customer === u.customer;
  if (u.role === 'technician') return tk.assignee === u.id && so.via === 'onsite' && Date.now() - so.at.getTime() < 15 * 60000;
  return false;
}
/* ลูกค้าเห็นแค่ "ขั้นตอน" ของภารกิจ (เช่น กำลังเดินทาง) — ไม่เห็นตำแหน่ง GPS */
function canSeeMissionStatus(u, tk) { return u.role === 'customer' ? tk.customer === u.customer : canSeeTicket(u, tk); }
/* โปรเจกต์: หัวหน้า/แอดมินเห็นทั้งหมด · ช่างเห็นที่ตัวเองรับผิดชอบ · ลูกค้าเห็นของบริษัทตัวเอง (ดูอย่างเดียว) */
function canSeeProject(u, p) { return isManager(u) || (u.role === 'technician' && p.owner === u.id) || (u.role === 'customer' && p.customer === u.customer); }
function canEditProject(u, p) { return isManager(u) || (u.role === 'technician' && p.owner === u.id); }
function canManageTeam(u) { return isManager(u); }
function canApproveMembers(u, customerId) { return u.role === 'customer' && !!u.approver && u.customer === customerId; }
function canRejectWork(u, tk) { return u.role === 'customer' && tk.customer === u.customer && tk.status === 'resolved'; }
function canSeeSummaryReport(u) { return isManager(u); }

/* พาร์ทเนอร์ / สถานที่ */
function canSeePartners(u) { return isManager(u); }
function canManagePartners(u) { return isManager(u); }
function sitesFor(u, customerId) {
  if (u.role === 'customer' && u.customer !== customerId) return [];
  return customers[customerId]?.sites || [];
}

function canSeeLocation(u, m) {
  if (u.role === 'technician') return m.technician === u.id;
  if (u.role === 'team_leader') return users[m.technician]?.team === u.team;
  return false;
}
function canSeeMissions(u) { return u.role === 'technician' || u.role === 'team_leader'; }
function canSeeAudit(u) { return isManager(u); }
function canSeeWorklog(u) { return isStaff(u); }
function canAddWorklog(u, tk) { return u.role === 'technician' && tk.assignee === u.id; }
function canManageUsers(u) { return u.role === 'admin'; }

/* ตารางสิทธิ์สำหรับหน้าผู้ดูแล (สรุปจากกฎด้านบน) */
const PERMISSION_MATRIX = [
  ['แจ้งปัญหาใหม่',               { customer: 1, technician: 0, team_leader: 1, admin: 1 }],
  ['เพิ่ม / ลบช่าง',               { customer: 0, technician: 0, team_leader: 1, admin: 1 }],
  ['ดูโปรเจกต์',                   { customer: 'ของบริษัท', technician: 'ที่รับผิดชอบ', team_leader: 1, admin: 1 }],
  ['อนุมัติพนักงานใหม่ของบริษัท',   { customer: 'ตัวแทนบริษัท', technician: 0, team_leader: 0, admin: 0 }],
  ['เห็นงาน',                     { customer: 'ของบริษัท', technician: 'ของตัวเอง', team_leader: 'ทั้งหมด', admin: 'ทั้งหมด' }],
  ['มอบหมายงาน',                  { customer: 0, technician: 0, team_leader: 'ในทีม', admin: 1 }],
  ['เปลี่ยนสถานะงาน',             { customer: 0, technician: 'งานของตัวเอง', team_leader: 1, admin: 1 }],
  ['ออกใบรายงานเมื่อเสร็จงาน',    { customer: 0, technician: 'งานของตัวเอง', team_leader: 1, admin: 1 }],
  ['เซ็นรับงาน',                  { customer: 'งานของบริษัท', technician: 'ให้ลูกค้าเซ็นหน้างาน', team_leader: 0, admin: 0 }],
  ['ให้คะแนนความพึงพอใจ',         { customer: 'งานของบริษัท', technician: 'ให้ลูกค้าให้คะแนนหน้างาน', team_leader: 0, admin: 0 }],
  ['ดู / พิมพ์ใบรายงาน',          { customer: 'ของบริษัท', technician: 'ของตัวเอง', team_leader: 1, admin: 1 }],
  ['รายงานสรุปผลงาน',             { customer: 0, technician: 0, team_leader: 1, admin: 1 }],
  ['จัดการพาร์ทเนอร์ / สถานที่',   { customer: 0, technician: 0, team_leader: 1, admin: 1 }],
  ['ปิดงาน (ไม่มีลายเซ็น) / เปิดซ้ำ', { customer: 0, technician: 0, team_leader: 1, admin: 1 }],
  ['เห็นบันทึกภายใน / Work log',  { customer: 0, technician: 1, team_leader: 1, admin: 1 }],
  ['ดูตำแหน่ง GPS',               { customer: 0, technician: 'ตัวเอง', team_leader: 'ในทีม', admin: 0 }],
  ['ดูบันทึกตรวจสอบ',             { customer: 0, technician: 0, team_leader: 1, admin: 1 }],
  ['จัดการผู้ใช้และสิทธิ์',        { customer: 0, technician: 0, team_leader: 0, admin: 1 }],
];
