/* เชื่อมฐานข้อมูลจริงผ่าน backend (/api) — งาน ลูกค้า สถานที่ และผู้ใช้ มาจาก server เท่านั้น
   ทุกการแก้ไขส่งไปให้ server ตรวจสิทธิ์และบันทึก แล้วโหลดข้อมูลชุดใหม่กลับมาวาดหน้าจอ */

// ข้อความเมื่อ server ปฏิเสธ (รหัสตรงกับที่ backend/server.js ส่งกลับ)
const API_ERR = {
  invalid_email: 'อีเมลไม่ถูกต้อง (เช่น name@company.com)',
  invalid_password: 'กรุณากรอกรหัสผ่าน',
  bad_credentials: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
  not_signed_in: 'หมดเวลาการใช้งาน กรุณาเข้าสู่ระบบใหม่',
  forbidden: 'ไม่มีสิทธิ์ทำรายการนี้',
  not_found: 'ไม่พบข้อมูลนี้ (อาจถูกลบหรือย้ายไปแล้ว)',
  status_changed: 'สถานะงานเปลี่ยนไปแล้ว — ข้อมูลล่าสุดแสดงอยู่บนจอ',
  use_resolve: 'กรุณาใช้ปุ่มทำเสร็จ (ต้องกรอกใบรายงาน)',
  invalid_assignee: 'เลือกช่างที่มอบหมายไม่ได้',
  invalid_text: 'ข้อความว่างหรือยาวเกินกำหนด',
  invalid_hours: 'จำนวนชั่วโมงไม่ถูกต้อง (0–999)',
  invalid_name: 'กรุณากรอกชื่อ (ไม่เกิน 100 ตัว)',
  invalid_signature: 'กรุณาเซ็นชื่อในกรอบก่อน',
  invalid_score: 'กรุณาเลือกคะแนน 1–5',
  already_rated: 'งานนี้ให้คะแนนไปแล้ว',
  invalid_role: 'บทบาทไม่ถูกต้อง',
  invalid_phone: 'เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)',
  invalid_new_password: 'รหัสผ่านต้องยาว 8–200 ตัว',
  invalid_company: 'กรุณาเลือกบริษัท',
  invalid_site: 'กรุณากรอกชื่อและที่อยู่ของสถานที่ให้ครบ',
  self_lockout: 'เปลี่ยนบทบาทหรือปิดบัญชีของตัวเองไม่ได้',
  email_taken: 'อีเมลนี้มีบัญชีอยู่แล้ว',
  invalid_subject: 'กรุณากรอกหัวข้อ (ไม่เกิน 120 ตัว)',
  invalid_category: 'กรุณาเลือกประเภทปัญหา',
  invalid_priority: 'กรุณาเลือกความสำคัญ',
  pending_approval: 'บัญชีนี้รอตัวแทนบริษัทยอมรับก่อน — ติดต่อตัวแทนของบริษัทคุณ',
  join_pending: 'อีเมลหรือเบอร์นี้ส่งคำขอแล้ว รอตัวแทนบริษัทยอมรับ',
  join_busy: 'มีคำขอค้างอยู่มากเกินไป ลองใหม่ภายหลัง',
  too_many_attempts: 'ใส่รหัสผิดหลายครั้ง — ติดต่อผู้ดูแลระบบเพื่อรีเซ็ต แล้วลองใหม่',
  invalid_photo: 'รูปไม่ถูกต้องหรือใหญ่เกินไป',
  invalid_date: 'วันที่ไม่ถูกต้อง',
  invalid_time: 'เวลาไม่ถูกต้อง (เช่น 09:00)',
  invalid_range: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม',
};

// เรียก API (มี body = POST) · คืนข้อมูลที่ได้ หรือโยน Error ที่มีข้อความภาษาไทยพร้อมแสดง
async function api(path, body) {
  let r;
  try {
    r = await fetch(`/api${path}`, body === undefined ? { cache: 'no-store' }
      : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new Error('ติดต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจการเชื่อมต่อ แล้วลองอีกครั้ง');
  }
  let d = {};
  try { d = JSON.parse(await r.text() || '{}', reviveDates); } catch { /* ตอบไม่ใช่ JSON */ }
  if (r.ok) return d;
  // session หมดอายุระหว่างใช้งาน: กลับไปหน้าเข้าสู่ระบบ
  if (r.status === 401 && currentUser) { clearData(); currentUser = null; closeModal(); closeSheet(); renderAll(); }
  throw new Error(API_ERR[d.error] || 'ทำรายการไม่สำเร็จ ลองใหม่อีกครั้ง');
}

function clearData() {
  for (const o of [users, customers]) for (const k of Object.keys(o)) delete o[k];
  tickets = []; auditLog = []; joinRequests = [];
}

// โหลดข้อมูลทั้งหมดที่ผู้ใช้คนนี้เห็นได้ แล้วแทนที่ของเดิม (ยังไม่เข้าสู่ระบบ = โยน Error)
async function loadState() {
  const s = await api('/state');
  clearData();
  Object.assign(users, s.users);
  Object.assign(customers, s.customers);
  tickets = s.tickets;
  auditLog = s.audit;
  joinRequests = s.joinRequests;
  currentUser = users[s.me] || null;
  await loadPhotos(s.photoIds);
}

// รูปจากเซิร์ฟเวอร์: โหลดเฉพาะรหัสที่ยังไม่มีในหน่วยความจำ แล้วเก็บใน PHOTOS เหมือนรูปที่เพิ่งแนบ (รูปที่โหลดไม่ได้ข้ามไป)
async function loadPhotos(ids) {
  await Promise.all(ids.filter(id => !PHOTOS[id]).map(async id => {
    try {
      const r = await fetch(`/api/photos/${encodeURIComponent(id)}`);
      if (!r.ok) return;
      const blob = await r.blob();
      PHOTOS[id] = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    } catch { /* รูปเดียวโหลดไม่ได้ ไม่ทำให้ข้อมูลทั้งหน้าโหลดไม่ขึ้น */ }
  }));
}


// ส่งคำสั่งแก้ไข แล้วโหลดข้อมูลล่าสุด · ไม่สำเร็จ: แสดงสาเหตุในช่อง errId (ถ้ามี) หรือ toast แล้วคืน null
async function call(path, body, errId) {
  try {
    const d = await api(path, body);
    await loadState();
    return d;
  } catch (e) {
    if (errId && $(errId)) $(errId).textContent = e.message; else toast(e.message);
    // ข้อมูลบนจอเก่าไปแล้ว (เช่น คนอื่นเปลี่ยนสถานะก่อน) — โหลดใหม่ให้ตรงกับ server
    if (currentUser) await loadState().then(renderAll, () => {});
    return null;
  }
}
