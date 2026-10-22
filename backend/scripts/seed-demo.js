// ใส่ข้อมูลตัวอย่างในฐานข้อมูล (บริษัท สถานที่ งานทุกสถานะ ใบรายงาน คะแนน โปรเจกต์ แจ้งเตือน):
//   node --env-file=.env scripts/seed-demo.js           # เพิ่มข้อมูลตัวอย่าง (รันซ้ำได้ — ล้างชุดเดิมก่อนเสมอ)
//   node --env-file=.env scripts/seed-demo.js --clear   # ลบข้อมูลตัวอย่างทั้งหมดที่สคริปต์นี้เคยสร้าง
// ใช้กับบัญชีทดสอบ demo-*@example.test ที่มีอยู่ · รายการที่สร้างถูกจดไว้ใน audit_log (action = 'seed-demo') เพื่อใช้ลบทีหลัง
// ก่อนใช้งานจริงต้องรัน --clear (และลบ/เปลี่ยนรหัสบัญชีทดสอบ)
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const DAY = 86400000, ago = (d, h = 9) => { const t = new Date(Date.now() - d * DAY); t.setHours(h, 0, 0, 0); return t; };
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function clear(c) {
  const { rows } = await c.query("select detail from audit_log where action = 'seed-demo'");
  const S = { tickets: [], customers: [], projects: [] };
  for (const r of rows) { try { const d = JSON.parse(r.detail); for (const k of Object.keys(S)) S[k].push(...(d[k] ?? [])); } catch { /* ข้ามแถวที่อ่านไม่ได้ */ } }
  const T = S.tickets;
  await c.query('delete from notifications where id like $1 or ticket_id = any($2)', ['NSEED%', T]);
  for (const t of ['ratings', 'signoffs', 'reports', 'worklogs', 'comments', 'ticket_history']) await c.query(`delete from ${t} where ticket_id = any($1)`, [T]);
  await c.query('delete from tickets where id = any($1)', [T]);
  await c.query('delete from project_tasks where project_id = any($1)', [S.projects]);
  await c.query('delete from projects where id = any($1)', [S.projects]);
  await c.query('delete from sites where customer_id = any($1)', [S.customers]);
  await c.query('delete from customers where id = any($1)', [S.customers]);
  return T.length;
}

const col = async (c, table, name) => (await c.query('select 1 from information_schema.columns where table_name = $1 and column_name = $2', [table, name])).rowCount > 0;

const c = await pool.connect();
try {
  await c.query('begin');
  const removed = await clear(c);
  if (process.argv.includes('--clear')) { await c.query('commit'); console.log(`ลบข้อมูลตัวอย่างแล้ว (${removed} งาน)`); process.exit(0); }

  const { rows: us } = await c.query("select id, email, role, customer_id, site_id from users where email like 'demo-%@example.test' and removed = false");
  const by = r => us.find(u => u.role === r);
  const tech = by('technician'), lead = by('team_leader'), admin = by('admin'), emp = by('customer');
  if (!tech || !lead || !emp) throw new Error('ไม่พบบัญชีทดสอบ demo-*@example.test (ช่าง/หัวหน้าทีม/ลูกค้า)');

  // บริษัทและสถานที่ตัวอย่าง
  const made = { tickets: [], customers: ['CSEED1', 'CSEED2'], projects: ['PSEED1', 'PSEED2'] };
  await c.query("insert into customers (id, name, contract, contact, phone, email) values ('CSEED1', 'บริษัท สยามเทค จำกัด (ตัวอย่าง)', 'ma', 'คุณวิชัย', '022223333', 'seed1@example.test'), ('CSEED2', 'หจก. การค้าไทย (ตัวอย่าง)', 'oncall', 'คุณสมชาย', '021112222', 'seed2@example.test')");
  await c.query(`insert into sites (id, customer_id, name, address, contact, phone, lat, lng) values
    ('SSEED1', 'CSEED1', 'สำนักงานสีลม', '99 ถนนสีลม บางรัก กรุงเทพฯ', 'คุณวิชัย', '022223333', 13.7248, 100.5326),
    ('SSEED2', 'CSEED1', 'สาขาบางนา', '88 ถนนบางนา-ตราด บางนา กรุงเทพฯ', 'คุณมานี', '023334444', 13.6684, 100.6049),
    ('SSEED3', 'CSEED2', 'คลังสินค้ารังสิต', '12 ถนนรังสิต-นครนายก ปทุมธานี', 'คุณสมชาย', '021112222', 13.9867, 100.6212)`);
  const demo = { c: emp.customer_id, s: emp.site_id };
  const where = { demo, s1: { c: 'CSEED1', s: 'SSEED1' }, s2: { c: 'CSEED1', s: 'SSEED2' }, s3: { c: 'CSEED2', s: 'SSEED3' } };

  const hasPlan = await col(c, 'tickets', 'planned_on'), hasMode = await col(c, 'tickets', 'work_mode');
  const { rows: [{ n }] } = await c.query("select coalesce(max(substr(id, 3)::bigint), 1000) as n from tickets");
  let next = Number(n);
  const rows = [
    // หัวข้อ, หมวด, ความสำคัญ, สถานะ, ผู้รับ, ที่ไหน, ประเภท, รูปแบบ, สร้างเมื่อ(วันก่อน), นัด(วันจากวันนี้ + ช่วง), รายงาน{ชม., เซ็น(none|onsite|app), คะแนน}
    ['เครื่องพิมพ์ชั้น 2 ไม่ติด', 'printer', 'urgent', 'new', null, 's1', 'service', 'onsite', 0],
    ['Wi-Fi ห้องประชุมหลุดบ่อย', 'network', 'high', 'new', null, 's2', 'service', 'onsite', 0],
    ['ขอสร้างบัญชีพนักงานใหม่', 'account', 'medium', 'new', null, 's3', 'service', 'remote', 1],
    ['ตั้งค่าอีเมลมือถือผู้บริหาร', 'account', 'medium', 'in_progress', tech, 'demo', 'service', 'remote', 1],
    ['ติดตั้งกล้อง CCTV ทางเข้า', 'cctv', 'medium', 'assigned', tech, 's2', 'service', 'onsite', 1, [0, '13:00', '15:00']],
    ['ตรวจเช็ก MA ประจำเดือน', 'other', 'low', 'assigned', tech, 's1', 'service', 'onsite', 2, [2, '09:00', '12:00']],
    ['เน็ตช้าตอนบ่ายทุกวัน', 'network', 'high', 'pending', tech, 's3', 'complaint', 'onsite', 4],
    ['เปลี่ยนสาย LAN ชั้น 3', 'network', 'medium', 'resolved', tech, 'demo', 'service', 'onsite', 1, null, { h: 2.5 }],
    ['ลง Office ให้พนักงานใหม่', 'install', 'low', 'closed', tech, 'demo', 'service', 'onsite', 6, null, { h: 1, sign: 'onsite', score: 5 }],
    ['เปลี่ยนแบตเตอรี่ UPS', 'repair', 'medium', 'closed', tech, 's3', 'service', 'onsite', 12, null, { h: 3, sign: 'app', score: 4 }],
    ['ย้ายเครื่องพิมพ์ไปชั้น 1', 'printer', 'low', 'closed', tech, 's1', 'service', 'onsite', 20, null, { h: 1.5, sign: 'onsite', score: 5 }],
    ['ตั้งค่า VPN ทำงานที่บ้าน', 'account', 'medium', 'closed', tech, 's2', 'service', 'remote', 33, null, { h: 1, sign: 'app', score: 5 }],
    ['ซ่อมกล้องวงจรปิดตัวที่ 4', 'cctv', 'high', 'closed', tech, 's2', 'service', 'onsite', 45, null, { h: 4, sign: 'onsite' }],
  ];
  for (const [subject, category, priority, status, assignee, w, type, mode, d, plan, rep] of rows) {
    const id = `T-${++next}`, loc = where[w], created = ago(d, 8);
    await c.query(`insert into tickets (id, type, customer_id, site_id, subject, category, priority, status, assignee_id, created_at${hasPlan ? ', planned_on, planned_from, planned_to' : ''}${hasMode ? ', work_mode' : ''})
      values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10${hasPlan ? ', $11, $12, $13' : ''}${hasMode ? `, $${hasPlan ? 14 : 11}` : ''})`,
      [id, type, loc.c, loc.s, subject, category, priority, status, assignee?.id ?? null, created,
        ...(hasPlan ? [plan ? new Date(Date.now() + plan[0] * DAY).toLocaleDateString('sv') : null, plan?.[1] ?? null, plan?.[2] ?? null] : []), ...(hasMode ? [mode] : [])]);
    made.tickets.push(id);
    const steps = ['new', 'assigned', 'in_progress', 'resolved', 'closed'], upto = status === 'pending' ? 2 : steps.indexOf(status);
    let prev = null;
    for (let i = 0; i <= Math.max(upto, 0); i++) {
      const to = steps[i]; if (to === 'assigned' && !assignee) continue;
      await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, at) values ($1,$2,$3,$4,$5)', [id, prev, to, to === 'new' ? emp.id : to === 'assigned' ? lead.id : tech.id, new Date(created.getTime() + i * 3600000)]);
      prev = to;
    }
    if (status === 'pending') await c.query("insert into ticket_history (ticket_id, from_status, to_status, by_user, reason, at) values ($1,'in_progress','pending',$2,'รออะไหล่จากลูกค้า',$3)", [id, tech.id, new Date(created.getTime() + 5 * 3600000)]);
    await c.query("insert into comments (ticket_id, by_user, vis, text, at) values ($1,$2,'public',$3,$4)", [id, emp.id, `แจ้งปัญหา: ${subject}`, created]);
    if (assignee) await c.query("insert into comments (ticket_id, by_user, vis, text, at) values ($1,$2,'public','รับเรื่องแล้วครับ จะเข้าตรวจสอบตามนัด',$3)", [id, tech.id, new Date(created.getTime() + 2 * 3600000)]);
    if (['in_progress', 'pending', 'resolved', 'closed'].includes(status)) await c.query("insert into worklogs (ticket_id, by_user, text, at) values ($1,$2,'ตรวจสอบหน้างาน ดำเนินการแก้ไขตามขั้นตอน ทดสอบการใช้งานปกติ',$3)", [id, tech.id, new Date(created.getTime() + 4 * 3600000)]);
    if (rep) {
      const at = new Date(created.getTime() + 6 * 3600000);
      const { rows: [{ no }] } = await c.query("select 'SR-' || extract(year from now())::int || '-' || lpad(nextval('report_seq')::text, 4, '0') as no");
      await c.query('insert into reports (ticket_id, no, summary, parts, hours, by_user, at) values ($1,$2,$3,$4,$5,$6,$7)', [id, no, 'ตรวจสอบและแก้ไขเรียบร้อย ทดสอบใช้งานปกติแล้ว', '', rep.h, tech.id, at]);
      if (rep.sign) await c.query('insert into signoffs (ticket_id, name, position, via, by_user, signature, at) values ($1,$2,$3,$4,$5,$6,$7)', [id, 'คุณวิชัย', 'ผู้จัดการ', rep.sign, rep.sign === 'app' ? emp.id : tech.id, PNG, new Date(at.getTime() + 3600000)]);
      if (rep.score) await c.query('insert into ratings (ticket_id, score, comment, by_user, via, at) values ($1,$2,$3,$4,$5,$6)', [id, rep.score, rep.score === 5 ? 'รวดเร็วมาก' : '', emp.id, 'app', new Date(at.getTime() + 7200000)]);
    }
  }

  // โปรเจกต์
  const due = d => new Date(Date.now() + d * DAY).toLocaleDateString('sv');
  await c.query("insert into projects (id, name, category, customer_id, site_id, owner_id, due) values ('PSEED1','ย้ายระบบเครือข่ายสาขาบางนา','network','CSEED1','SSEED2',$1,$2), ('PSEED2','ติดตั้งกล้องคลังสินค้า','cctv','CSEED2','SSEED3',$1,$3)", [tech.id, due(30), due(-2)]);
  const tasks = [['PSEED1', 'สำรวจจุดติดตั้ง', true], ['PSEED1', 'ติดตั้ง Switch ชั้น 1', false], ['PSEED1', 'ทดสอบความเร็วเครือข่าย', false], ['PSEED2', 'เดินสายสัญญาณ', true], ['PSEED2', 'ตั้งค่า NVR', true]];
  for (const [i, [p, text, done]] of tasks.entries()) await c.query('insert into project_tasks (project_id, position, text, done) values ($1,$2,$3,$4)', [p, i + 1, text, done]);

  // แจ้งเตือน
  const first = made.tickets[0];
  const ns = [[lead.id, 'งานใหม่ · ด่วนมาก', 'เครื่องพิมพ์ชั้น 2 ไม่ติด — บริษัท สยามเทค จำกัด (ตัวอย่าง)', first], [lead.id, 'งานใหม่', 'Wi-Fi ห้องประชุมหลุดบ่อย — บริษัท สยามเทค จำกัด (ตัวอย่าง)', made.tickets[1]], [tech.id, 'ได้รับมอบหมายงาน', 'ติดตั้งกล้อง CCTV ทางเข้า — สาขาบางนา', made.tickets[4]]];
  if (admin) ns.push([admin.id, 'งานใหม่', 'ขอสร้างบัญชีพนักงานใหม่', made.tickets[2]]);
  for (const [i, [to, title, body, tid]] of ns.entries()) await c.query('insert into notifications (id, to_user, title, body, ticket_id) values ($1,$2,$3,$4,$5)', [`NSEED${i + 1}`, to, title, body, tid]);

  await c.query("insert into audit_log (actor_name, role, action, detail) values ('seed-demo', 'system', 'seed-demo', $1)", [JSON.stringify(made)]);
  await c.query('commit');
  console.log(`เพิ่มข้อมูลตัวอย่างแล้ว: ${made.tickets.length} งาน (${made.tickets[0]}–${made.tickets.at(-1)}), 2 บริษัท, 3 สถานที่, 2 โปรเจกต์, ${ns.length} แจ้งเตือน`);
  console.log(`คอลัมน์ที่ใช้: นัดหมาย=${hasPlan} รูปแบบงาน=${hasMode}`);
} catch (err) {
  await c.query('rollback').catch(() => {});
  console.error('ไม่สำเร็จ (ยกเลิกทั้งชุด):', err.message);
  process.exitCode = 1;
} finally {
  c.release(); await pool.end();
}
