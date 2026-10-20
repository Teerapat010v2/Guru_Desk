// กติกาสถานะและสิทธิ์ — ตรงกับ js/permissions.js เดิม ตรวจฝั่ง server ทุกครั้ง (หน้าเว็บแค่ซ่อนปุ่ม)
export const STATUS_FLOW = {
  new: ['assigned'], assigned: ['in_progress'], in_progress: ['pending', 'resolved'],
  pending: ['in_progress'], resolved: ['closed', 'in_progress'], closed: ['in_progress'],
};

export const isStaff = u => u.role !== 'customer';
export const isManager = u => u.role === 'team_leader' || u.role === 'admin';

// เปลี่ยนสถานะได้ไหม (มอบหมายต้องใช้ canAssign ไม่ใช่การเปลี่ยนสถานะ)
export function canTransition(u, t, to) {
  if (u.role === 'customer' || to === 'assigned') return false;
  if (!STATUS_FLOW[t.status]?.includes(to)) return false;
  if (t.status === 'closed' || t.status === 'resolved') return isManager(u);   // เปิดซ้ำ / ส่งกลับ / ปิดโดยไม่มีลายเซ็น
  if (u.role === 'technician') return t.assignee_id === u.id;
  return true;
}

// เปิดงานใหม่: ลูกค้า (เฉพาะบริษัทตัวเอง) หรือหัวหน้าทีม/ผู้ดูแล (แทนลูกค้ารายใดก็ได้) · ช่างเปิดงานเองไม่ได้
export const canCreateTicket = u => u.role === 'customer' ? !!u.customer_id : isManager(u);
export const canAssign =(u, t) => isManager(u) && ['new', 'assigned', 'pending'].includes(t.status);
// หัวหน้าทีมมอบหมายได้เฉพาะช่างในทีมตัวเอง (ต้องมีทีมจริง) ผู้ดูแลได้ทุกคน
export const canAssignTech = (u, tech) => u.role === 'admin' || (!!u.team && tech.team === u.team);
export const canWorklog = (u, t) => u.role === 'technician' && t.assignee_id === u.id;

// ทำเสร็จต้องมีใบรายงาน จึงใช้ปุ่มเฉพาะ (ไม่ผ่านการเปลี่ยนสถานะทั่วไป)
export const canResolve = (u, t) => canTransition(u, t, 'resolved');
// ลงนามรับงาน: ต้องมีใบรายงานและยังไม่เคยลงนาม · ลูกค้าลงนามเอง หรือช่างที่รับผิดชอบยื่นให้เซ็นหน้างาน
export const canSignOff = (u, t, s) => t.status === 'resolved' && s.report && !s.signed
  && (u.role === 'customer' || (u.role === 'technician' && t.assignee_id === u.id));
// ให้คะแนน: หลังลงนาม · ลูกค้าให้ได้ครั้งเดียว · ช่างให้ได้เฉพาะเซ็นหน้างาน และภายใน 15 นาที
export const canRate = (u, t, s) => t.status === 'closed' && !!s.signed && !s.rated
  && (u.role === 'customer' || (u.role === 'technician' && t.assignee_id === u.id && s.signed.via === 'onsite'
      && Date.now() - new Date(s.signed.at).getTime() < 15 * 60000));
// ลูกค้าแจ้งว่างานยังไม่เรียบร้อย: ส่งงานที่รอเซ็นรับกลับไปให้ช่างทำต่อ (server ตรวจแล้วว่าเป็นงานของบริษัทตัวเอง)
export const canReject = (u, t) => u.role === 'customer' && t.status === 'resolved';
// พาร์ทเนอร์/สถานที่ และทีมช่าง: หัวหน้าทีมและผู้ดูแล · ผู้ใช้ทุกบทบาท: ผู้ดูแลเท่านั้น
export const canManagePartners = isManager;
export const canManageTeam = isManager;
