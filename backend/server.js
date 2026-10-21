// API ของ Guru IT Service Desk — ต่อ PostgreSQL (ตาราง users, sessions ใน db/schema.sql)
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { hashPassword, verifyPassword, hashToken, newToken } from './auth.js';
import { isStaff, isManager, canCreateTicket, canTransition, canReject, canAssign, canAssignTech, canWorklog, canResolve, canSignOff, canRate, canManagePartners, canManageTeam, canEditProject, canApproveMembers } from './rules.js';

const port = Number(process.env.PORT || 4000);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['admin', 'team_leader', 'technician', 'customer'];
const CATEGORIES = ['printer', 'network', 'account', 'install', 'repair', 'cctv', 'other'];
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const COOKIE = 'gd_session';
const SESSION_HOURS = 12;
const failedLogins = new Map();   // อีเมล → จำนวนครั้งที่ใส่รหัสผิดติดกัน
// ใช้ตรวจรหัสเมื่อไม่มีบัญชี เพื่อให้เวลาตอบใกล้เคียงกัน (กันเดาว่าอีเมลไหนมีบัญชี)
const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
};
// ข้อมูลจากเบราว์เซอร์ไม่น่าเชื่อถือ: จำกัดขนาด (ภาษาไทย 1 ตัว = 3 ไบต์ ข้อความ 2000 ตัวจึงเกิน 4 KB) และถ้า JSON เสียให้ถือว่าว่าง
// max: ลายเซ็นเป็นรูป PNG แบบ base64 จึงต้องใหญ่กว่าข้อความทั่วไป · คำสั่งที่แนบรูปได้ใช้ PHOTO_BODY
const PHOTO_BODY = 4_000_000;
const readJson = (req, max = 262144) => new Promise(resolve => {
  let s = '';
  req.on('data', c => { s += c; if (s.length > max) req.destroy(); });
  req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
});
const sessionToken = req => (req.headers.cookie ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1] ?? null;
const cookie = (value, maxAge) => `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`;
const scopeOf = u => (isManager(u) ? 'all' : u.role);

// ลายเซ็นต้องเป็นไฟล์ PNG จริง: มี signature ของ PNG และ chunk IHDR ตามหลัง (ไม่ใช่แค่ข้อความที่หน้าตาคล้าย)
const PNG_MAGIC = Buffer.from('89504e470d0a1a0a', 'hex');
function validPng(sig) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]{32,200000})$/.exec(sig);
  if (!m) return false;
  const b = Buffer.from(m[1], 'base64');
  return b.length >= 33 && b.subarray(0, 8).equals(PNG_MAGIC) && b.subarray(12, 16).toString('latin1') === 'IHDR';
}

/* รูปแนบ: หน้าเว็บย่อเป็น JPEG (ด้านยาว 1024px) แล้วส่งมาเป็น dataURL
   รหัสรูป = "เจ้าของ:ชนิด:สุ่ม" เพื่อผูกกับข้อมูลโดยไม่ต้องเพิ่มคอลัมน์ —
   t = รูปตอนเปิดงาน · c<id> = ความเห็น · w<id> = work log · r = ใบรายงาน (เจ้าของคือเลขงาน) · u = รูปโปรไฟล์ (รหัสผู้ใช้) · j = คำขอสมัคร (รหัสคำขอ) */
const MAX_PHOTOS = 5;
const JPEG = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]{100,700000})$/;
const PHOTO_ID = /^([\w-]{1,40}):([tcwruj])(\d{0,18}):[0-9a-f]{12}$/;
// คืนรายการ dataURL ที่ถูกต้อง · ไม่ส่งมา = [] · ผิดรูปแบบหรือเกินจำนวน = null
function parsePhotos(v, max = MAX_PHOTOS) {
  if (v == null) return [];
  if (!Array.isArray(v) || v.length > max) return null;
  for (const p of v) {
    const m = typeof p === 'string' && JPEG.exec(p);
    if (!m || Buffer.from(m[1].slice(0, 8), 'base64').subarray(0, 3).toString('hex') !== 'ffd8ff') return null;
  }
  return v;
}
async function savePhotos(q, owner, kind, list) {
  const ids = list.map(() => `${owner}:${kind}:${randomBytes(6).toString('hex')}`);
  for (let i = 0; i < ids.length; i++) await q.query('insert into photos (id, data) values ($1, $2)', [ids[i], list[i]]);
  return ids;
}

// การแจ้งเตือน: server สร้างเองตามการกระทำ (ผู้ใช้ส่งแจ้งเตือนหาคนอื่นตรง ๆ ไม่ได้) · ข้ามบัญชีที่ปิดแล้ว
async function notify(q, toIds, title, body, ticketId = null, go = null) {
  const to = [...new Set(toIds.filter(Boolean))];
  if (!to.length) return;
  const { rows } = await q.query('select id from users where id = any($1) and removed = false', [to]);
  for (const { id } of rows)
    await q.query('insert into notifications (id, to_user, title, body, ticket_id, go) values ($1, $2, $3, $4, $5, $6)',
      [`N${randomBytes(6).toString('hex')}`, id, title.slice(0, 200), body.slice(0, 500), ticketId, go]);
}
// หัวหน้าทีมและผู้ดูแลที่ยังใช้งานอยู่ (คนกระจายงาน)
const dispatchers = async q => (await q.query("select id from users where role in ('team_leader', 'admin') and removed = false")).rows.map(r => r.id);
const companyUsers = async (q, cid) => (await q.query("select id from users where role = 'customer' and customer_id = $1", [cid])).rows.map(r => r.id);

// ผู้ใช้ที่เข้าสู่ระบบอยู่ (จาก session ที่ยังไม่หมดอายุ) หรือ null
async function currentUser(req) {
  const t = sessionToken(req);
  if (!t) return null;
  const { rows: [u] } = await pool.query(
    `select u.id, u.name, u.role, u.team, u.customer_id, u.approver from sessions s
     join users u on u.id = s.user_id
     where s.token_hash = $1 and s.expires_at > now() and u.removed = false`, [hashToken(t)]);
  return u ?? null;
}

// งานที่ผู้ใช้มีสิทธิ์เห็น (ไม่มีสิทธิ์ = null) — ใช้ตรวจทุกการกระทำ ไม่เชื่อค่าจากเบราว์เซอร์
async function visibleTicket(me, id) {
  const { rows: [t] } = await pool.query(
    `select t.id, t.status, t.assignee_id, t.customer_id from tickets t
     where t.id = $1 and (($2 = 'all')
        or ($2 = 'technician' and t.assignee_id = $3)
        or ($2 = 'customer' and t.customer_id = $4))`, [id, scopeOf(me), me.id, me.customer_id]);
  return t ?? null;
}

// บันทึกตรวจสอบ (เพิ่มอย่างเดียว) — q คือ pool หรือ client ของธุรกรรม
const audit = (q, me, action, detail = null) =>
  q.query('insert into audit_log (actor_name, role, action, detail) values ($1, $2, $3, $4)', [me.name, me.role, action, detail]);
const STATUS_TH = { new: 'ใหม่', assigned: 'มอบหมายแล้ว', in_progress: 'กำลังดำเนินการ', pending: 'พักงาน', resolved: 'รอลูกค้าเซ็นรับ', closed: 'ปิดงาน' };

// ทำหลายคำสั่งเป็นชุดเดียว: ถ้าขั้นใดพัง ไม่บันทึกครึ่งๆ กลางๆ
async function inTx(fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/api/health') {
      await pool.query('select 1');
      return send(res, 200, { ok: true });
    }
    if (req.method === 'POST' && req.url === '/api/login') {
      const { email, password } = await readJson(req);
      const e = String(email ?? '').trim().toLowerCase();
      const pw = String(password ?? '');
      if (e.length > 100 || !EMAIL.test(e)) return send(res, 400, { error: 'invalid_email' });
      if ((failedLogins.get(e) ?? 0) >= 10) return send(res, 429, { error: 'too_many_attempts' });
      if (!pw || pw.length > 200) return send(res, 400, { error: 'invalid_password' });

      const { rows: [u] } = await pool.query(
        'select id, name, role, password_hash, removed, customer_id from users where email = $1', [e]);
      const ok = await verifyPassword(pw, u?.password_hash ?? DUMMY_HASH);
      if (!u || !u.password_hash || !ok) {
        failedLogins.set(e, (failedLogins.get(e) ?? 0) + 1);
        return send(res, 401, { error: 'bad_credentials' });
      }
      failedLogins.delete(e);
      // บัญชีที่ยังรอตัวแทนบริษัทยอมรับ: บอกให้รอเฉพาะเมื่อรหัสถูก จึงไม่เปิดเผยว่าอีเมลไหนมีบัญชี
      if (u.removed) {
        const { rowCount } = await pool.query("select 1 from join_requests where email = $1 and customer_id = $2 and status = 'pending'", [e, u.customer_id]);
        return send(res, rowCount ? 403 : 401, { error: rowCount ? 'pending_approval' : 'bad_credentials' });
      }

      await pool.query('delete from sessions where expires_at < now()');
      const token = newToken();
      await pool.query(
        "insert into sessions (token_hash, user_id, expires_at) values ($1, $2, now() + make_interval(hours => $3))",
        [hashToken(token), u.id, SESSION_HOURS]);
      return send(res, 200, { id: u.id, name: u.name, role: u.role },
        { 'set-cookie': cookie(token, SESSION_HOURS * 3600) });
    }
    if (req.method === 'POST' && req.url === '/api/logout') {
      const t = sessionToken(req);
      if (t) await pool.query('delete from sessions where token_hash = $1', [hashToken(t)]);
      return send(res, 200, { ok: true }, { 'set-cookie': cookie('', 0) });
    }
    if (req.method === 'GET' && req.url === '/api/me') {
      const u = await currentUser(req);
      return u ? send(res, 200, { id: u.id, name: u.name, role: u.role }) : send(res, 401, { error: 'not_signed_in' });
    }
    // ข้อมูลทั้งหมดที่ผู้ใช้คนนี้มีสิทธิ์เห็น ในรูปแบบเดียวกับที่หน้าเว็บ (js/app.js) ใช้ — โหลดใหม่หลังทุกการกระทำ
    // shortcut: ส่งทุกงานที่เห็นได้พร้อมลายเซ็นในครั้งเดียว — แบ่งหน้า/โหลดเฉพาะงานที่เปิดเมื่อมีงานหลายพันรายการ
    if (req.method === 'GET' && req.url === '/api/state') {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const staff = isStaff(me);
      const { rows: tks } = await pool.query(`
        select * from tickets t
        where ($1 = 'all') or ($1 = 'technician' and t.assignee_id = $2) or ($1 = 'customer' and t.customer_id = $3)
        order by t.created_at desc`, [scopeOf(me), me.id, me.customer_id]);
      const ids = tks.map(t => t.id);
      const [hist, cmts, wls, reps, us, cs, ss] = await Promise.all([
        pool.query('select ticket_id, from_status, to_status, by_user, reason, at from ticket_history where ticket_id = any($1) order by at, id', [ids]),
        // ลูกค้าเห็นเฉพาะความเห็นสาธารณะ และไม่เห็น work log (ข้อมูลภายใน)
        pool.query(`select id, ticket_id, by_user, vis, text, at from comments where ticket_id = any($1) ${staff ? '' : "and vis = 'public'"} order by at, id`, [ids]),
        staff ? pool.query('select id, ticket_id, by_user, text, photo_ids, at from worklogs where ticket_id = any($1) order by at, id', [ids]) : { rows: [] },
        pool.query(`select r.ticket_id, r.no, r.summary, r.parts, r.hours, r.by_user, r.at,
                           s.name as s_name, s.position as s_position, s.via as s_via, s.by_user as s_by, s.at as s_at, s.signature,
                           rt.score, rt.comment as r_comment, rt.by_user as r_by, rt.via as r_via, rt.at as r_at
                    from reports r left join signoffs s on s.ticket_id = r.ticket_id left join ratings rt on rt.ticket_id = r.ticket_id
                    where r.ticket_id = any($1)`, [ids]),
        pool.query('select id, name, role, team, phone, email, customer_id, site_id, approver, skills, removed from users order by name'),
        pool.query('select id, name, contract, contact, phone, email from customers order by name'),
        pool.query('select id, customer_id, name, address, contact, phone, lat, lng from sites order by id'),
      ]);
      // คำขอสมัครที่รออนุมัติ: เฉพาะตัวแทนบริษัทนั้น
      const joins = me.role === 'customer' && me.approver
        ? (await pool.query("select id, customer_id, site_id, name, email, phone, photo_id, at from join_requests where customer_id = $1 and status = 'pending' order by at", [me.customer_id])).rows : [];
      // รหัสรูปของงาน ผู้ใช้ และคำขอสมัคร (ไม่ส่งตัวรูป — หน้าเว็บโหลดทีละรูปจาก /api/photos/:id ซึ่งตรวจสิทธิ์อีกชั้น)
      // shortcut: split_part ใช้ดัชนีไม่ได้ — ย้ายเป็นคอลัมน์เจ้าของรูปเมื่อรูปมีหลายหมื่น
      const { rows: phs } = await pool.query('select id from photos where split_part(id, \':\', 1) = any($1) order by id',
        [[...ids, ...us.rows.map(u => u.id), ...joins.map(j => j.id)]]);
      const P = {};
      for (const { id } of phs) { const [, owner, kind, n] = PHOTO_ID.exec(id) ?? []; if (owner) (P[`${owner}:${kind}${n}`] ||= []).push(id); }
      const by = (rows, k = 'ticket_id') => rows.reduce((m, r) => ((m[r[k]] ||= []).push(r), m), {});
      const H = by(hist.rows), C = by(cmts.rows), W = by(wls.rows), R = Object.fromEntries(reps.rows.map(r => [r.ticket_id, r]));
      const tickets = tks.map(t => {
        const r = R[t.id], history = (H[t.id] ?? []).map(h => ({ from: h.from_status, to: h.to_status, by: h.by_user, at: h.at, reason: h.reason }));
        return {
          id: t.id, type: t.type, customer: t.customer_id, siteId: t.site_id, location: t.location ?? '', subject: t.subject,
          category: t.category, priority: t.priority, status: t.status, assignee: t.assignee_id, version: t.version, missionId: null, photos: P[`${t.id}:t`] ?? [],
          history, comments: (C[t.id] ?? []).map(c => ({ by: c.by_user, vis: c.vis, text: c.text, at: c.at, photos: P[`${t.id}:c${c.id}`] ?? [] })),
          worklogs: (W[t.id] ?? []).map(w => ({ by: w.by_user, text: w.text, at: w.at, photos: w.photo_ids })),
          report: r ? {
            no: r.no, summary: r.summary, parts: r.parts, hours: Number(r.hours), by: r.by_user, at: r.at, photos: P[`${t.id}:r`] ?? [],
            signoff: r.s_via ? { name: r.s_name, position: r.s_position ?? '', via: r.s_via, by: r.s_by, at: r.s_at, sig: r.signature } : null,
            // ปิดงานโดยไม่มีลายเซ็น: เหตุผลอยู่ในประวัติการเปลี่ยนสถานะครั้งล่าสุด
            closedNoSign: !r.s_via && t.status === 'closed' ? history.findLast(h => h.to === 'closed')?.reason ?? '' : undefined,
          } : null,
          rating: r?.score != null ? { score: r.score, comment: r.r_comment, by: r.r_by, via: r.r_via, at: r.r_at } : null,
        };
      });
      // บริษัทที่เห็นได้: หัวหน้าทีม/ผู้ดูแลเห็นทั้งหมด · ช่างเห็นเฉพาะที่มีงานของตัวเอง · ลูกค้าเห็นบริษัทตัวเอง
      const seeCust = new Set(isManager(me) ? cs.rows.map(c => c.id) : me.role === 'customer' ? [me.customer_id] : tks.map(t => t.customer_id));
      const sites = by(ss.rows.filter(s => seeCust.has(s.customer_id)), 'customer_id');
      const customers = Object.fromEntries(cs.rows.filter(c => seeCust.has(c.id)).map(c => [c.id, {
        id: c.id, name: c.name, contract: c.contract, contact: c.contact ?? '', phone: c.phone ?? '', email: c.email ?? '',
        sites: (sites[c.id] ?? []).map(s => ({ id: s.id, name: s.name, address: s.address, contact: s.contact ?? '', phone: s.phone ?? '', lat: s.lat, lng: s.lng })),
      }]));
      // ข้อมูลติดต่อเต็ม: หัวหน้าทีม/ผู้ดูแลเห็นทุกคน · ช่างเห็นทีมงาน · ลูกค้าเห็นคนในบริษัทตัวเอง · คนอื่นเห็นแค่ชื่อ (ลูกค้าบริษัทอื่นไม่เห็นเลย)
      const users = {};
      for (const u of us.rows) {
        const full = isManager(me) || (me.role === 'technician' && u.role !== 'customer') || (me.role === 'customer' && u.customer_id === me.customer_id);
        if (!full && u.role === 'customer' && !seeCust.has(u.customer_id)) continue;
        users[u.id] = full
          ? { id: u.id, name: u.name, role: u.role, team: u.team, phone: u.phone ?? '', email: u.email ?? '', customer: u.customer_id, siteId: u.site_id, approver: u.approver, skills: u.skills, removed: u.removed }
          : { id: u.id, name: u.name, role: u.role, team: u.team, customer: u.customer_id, skills: [], removed: u.removed };
        users[u.id].photo = P[`${u.id}:u`]?.at(-1) ?? null;
      }
      // โปรเจกต์: หัวหน้าทีม/ผู้ดูแลเห็นทั้งหมด · ช่างเห็นที่ตัวเองรับผิดชอบ · ลูกค้าเห็นของบริษัทตัวเอง (กฎเดียวกับ canSeeProject)
      const [pjs, notes, auditRows] = await Promise.all([
        pool.query(`select p.id, p.name, p.category, p.customer_id, p.site_id, p.owner_id, to_char(p.due, 'YYYY-MM-DD') as due, p.created_at,
                           coalesce(json_agg(json_build_object('id', t.id, 'text', t.text, 'done', t.done) order by t.position, t.id) filter (where t.id is not null), '[]') as tasks
                    from projects p left join project_tasks t on t.project_id = p.id
                    where $1 = 'all' or ($1 = 'technician' and p.owner_id = $2) or ($1 = 'customer' and p.customer_id = $3)
                    group by p.id order by p.due, p.id`, [scopeOf(me), me.id, me.customer_id]),
        pool.query('select id, title, body, ticket_id, go, read, at from notifications where to_user = $1 order by at desc limit 100', [me.id]),
        // บันทึกตรวจสอบ: หัวหน้าทีม/ผู้ดูแลเท่านั้น (ล่าสุด 300 รายการ)
        isManager(me) ? pool.query('select at, actor_name as actor, role, action, detail from audit_log order by at desc, id desc limit 300') : { rows: [] },
      ]);
      const projects = pjs.rows.map(p => ({ id: p.id, name: p.name, category: p.category, customer: p.customer_id, siteId: p.site_id,
        owner: p.owner_id, due: p.due, createdAt: p.created_at, tasks: p.tasks }));
      const notifs = notes.rows.map(n => ({ id: n.id, to: me.id, title: n.title, body: n.body, ticketId: n.ticket_id, go: n.go, read: n.read, at: n.at }));
      const joinRequests = joins.map(j => ({ id: j.id, customer: j.customer_id, siteId: j.site_id, name: j.name, email: j.email, phone: j.phone,
        photo: j.photo_id, at: j.at, status: 'pending' }));
      // รูปทั้งหมดที่หน้าเว็บอ้างถึงได้ (ตรงกับที่ /api/photos/:id ยอมให้โหลด)
      const photoIds = [...tickets.flatMap(t => [...t.photos, ...t.comments.flatMap(c => c.photos), ...t.worklogs.flatMap(w => w.photos), ...(t.report?.photos ?? [])]),
        ...Object.values(users).map(u => u.photo).filter(Boolean), ...joinRequests.map(j => j.photo).filter(Boolean)];
      return send(res, 200, { me: me.id, users, customers, tickets, audit: auditRows.rows, projects, notifs, joinRequests, photoIds });
    }
    if (req.method === 'POST' && req.url === '/api/tickets') {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      if (!canCreateTicket(me)) return send(res, 403, { error: 'forbidden' });
      const b = await readJson(req, PHOTO_BODY);
      const type = b.type === 'complaint' ? 'complaint' : 'service';
      const desc = String(b.desc ?? '').trim();
      const photos = parsePhotos(b.photos);
      if (desc.length > 2000) return send(res, 400, { error: 'invalid_text' });
      if (!photos) return send(res, 400, { error: 'invalid_photo' });
      let t;
      if (me.role === 'customer') {
        // ลูกค้าเล่าปัญหาช่องเดียว: บรรทัดแรกเป็นหัวข้อ ทีมงานแก้หมวดทีหลังได้ · ร้องเรียนให้ความสำคัญสูงเสมอ
        // แนบรูปอย่างเดียวได้ (ไม่ต้องพิมพ์)
        if (!desc && !photos.length) return send(res, 400, { error: 'invalid_text' });
        const first = desc.split('\n')[0].trim() || 'แจ้งปัญหาพร้อมรูปภาพ';
        // หมวดที่หน้าเว็บเดาจากข้อความ (ไม่ถูกก็ใช้ "อื่น ๆ")
        t = { type, customerId: me.customer_id, location: null, category: CATEGORIES.includes(b.category) && type === 'service' ? b.category : 'other',
          subject: first.length > 60 ? `${first.slice(0, 57)}…` : first,
          priority: type === 'complaint' ? 'high' : b.urgent === true ? 'urgent' : 'medium' };
      } else {
        t = { type, customerId: String(b.customerId ?? ''), location: String(b.location ?? '').trim().slice(0, 100) || null,
          category: String(b.category ?? ''), subject: String(b.subject ?? '').trim(), priority: String(b.priority ?? '') };
        if (!t.subject || t.subject.length > 120) return send(res, 400, { error: 'invalid_subject' });
        if (!CATEGORIES.includes(t.category)) return send(res, 400, { error: 'invalid_category' });
        if (!PRIORITIES.includes(t.priority)) return send(res, 400, { error: 'invalid_priority' });
      }
      t.siteId = b.siteId ? String(b.siteId) : null;
      try {
        const id = await inTx(async c => {
          // สถานที่ต้องเป็นของบริษัทเดียวกับงาน
          if (t.siteId && !(await c.query('select 1 from sites where id = $1 and customer_id = $2', [t.siteId, t.customerId])).rowCount) return null;
          // ล็อกสั้น ๆ กันสองคนได้เลขงานเดียวกัน (ผู้ใช้ของแอปสร้าง sequence เองไม่ได้)
          await c.query("select pg_advisory_xact_lock(hashtext('ticket_id'))");
          const { rows: [{ n }] } = await c.query("select coalesce(max(substr(id, 3)::bigint), 1000) + 1 as n from tickets");
          const tid = `T-${n}`;
          await c.query(`insert into tickets (id, type, customer_id, site_id, location, subject, category, priority, status)
                         values ($1, $2, $3, $4, $5, $6, $7, $8, 'new')`, [tid, t.type, t.customerId, t.siteId, t.location, t.subject, t.category, t.priority]);
          await c.query("insert into ticket_history (ticket_id, from_status, to_status, by_user) values ($1, null, 'new', $2)", [tid, me.id]);
          if (desc) await c.query("insert into comments (ticket_id, by_user, vis, text) values ($1, $2, 'public', $3)", [tid, me.id, desc]);
          await savePhotos(c, tid, 't', photos);
          await audit(c, me, `เปิดงาน ${tid}`, t.subject);
          // แจ้งคนกระจายงาน (ยกเว้นคนที่เปิดงานเอง)
          const title = me.role !== 'customer' ? 'งานใหม่' : type === 'complaint' ? 'เรื่องร้องเรียนใหม่' : `งานใหม่${t.priority === 'urgent' ? ' · ด่วนมาก' : ''}`;
          const { rows: [co] } = await c.query('select name from customers where id = $1', [t.customerId]);
          await notify(c, (await dispatchers(c)).filter(x => x !== me.id), title, `${t.subject} — ${co?.name ?? '-'}`, tid);
          return tid;
        });
        return id ? send(res, 200, { id }) : send(res, 400, { error: 'invalid_site' });
      } catch (err) {
        if (err.code === '23503') return send(res, 400, { error: 'invalid_company' });   // บริษัทไม่มีอยู่จริง
        throw err;
      }
    }
    // การกระทำกับงาน: ตรวจสิทธิ์ทุกครั้งที่ server
    const act = req.method === 'POST' ? req.url.match(/^\/api\/tickets\/(T-\d{1,10})\/(status|assign|comments|worklog|resolve|signoff|rating)$/) : null;
    if (act) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const [, id, action] = act;
      const t = await visibleTicket(me, id);
      if (!t) return send(res, 404, { error: 'not_found' });
      const body = await readJson(req, PHOTO_BODY);
      const text = String(body.text ?? '').trim();
      const photos = parsePhotos(body.photos);
      if (!photos) return send(res, 400, { error: 'invalid_photo' });
      const reason = String(body.reason ?? '').trim().slice(0, 500) || null;

      if (action === 'status') {
        const to = String(body.to ?? '');
        // ทำเสร็จต้องมีใบรายงาน ใช้ /resolve เท่านั้น
        if (to === 'resolved') return send(res, 400, { error: 'use_resolve' });
        const reject = to === 'in_progress' && canReject(me, t);
        if (!canTransition(me, t, to) && !reject) return send(res, 403, { error: 'forbidden' });
        if (reject && !reason) return send(res, 400, { error: 'invalid_text' });   // ลูกค้าต้องบอกว่ายังพบปัญหาอะไร
        const done = await inTx(async c => {
          // เงื่อนไข status เดิมกันคนสองคนเปลี่ยนสถานะพร้อมกัน
          const r = await c.query('update tickets set status = $2, version = version + 1 where id = $1 and status = $3', [id, to, t.status]);
          if (r.rowCount === 0) return false;
          if (reject) await c.query("insert into comments (ticket_id, by_user, vis, text) values ($1, $2, 'public', $3)", [id, me.id, `ยังไม่เรียบร้อย: ${reason}`]);
          await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, reason) values ($1, $2, $3, $4, $5)',
            [id, t.status, to, me.id, reject ? `ลูกค้าแจ้งว่ายังไม่เรียบร้อย: ${reason}` : reason]);
          await audit(c, me, reject ? `ลูกค้าส่งงานกลับ ${id}` : `เปลี่ยนสถานะ ${id}`, `→ ${STATUS_TH[to]}${reason ? ` · ${reason}` : ''}`);
          return true;
        });
        return done ? send(res, 200, { ok: true }) : send(res, 409, { error: 'status_changed' });
      }
      if (action === 'assign') {
        if (!canAssign(me, t)) return send(res, 403, { error: 'forbidden' });
        const { rows: [tech] } = await pool.query(
          "select id, name, team from users where id = $1 and role = 'technician' and removed = false", [String(body.assigneeId ?? '')]);
        if (!tech || !canAssignTech(me, tech)) return send(res, 400, { error: 'invalid_assignee' });
        const done = await inTx(async c => {
          const r = await c.query(
            "update tickets set assignee_id = $2, status = case when status = 'new' then 'assigned' else status end, version = version + 1 where id = $1 and status = $3",
            [id, tech.id, t.status]);
          if (r.rowCount === 0) return false;
          await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, reason) values ($1, $2, $3, $4, $5)',
            [id, t.status, t.status === 'new' ? 'assigned' : t.status, me.id, `มอบหมายให้ ${tech.name}`]);
          await audit(c, me, `มอบหมาย ${id}`, `→ ${tech.name}`);
          const { rows: [x] } = await c.query('select t.subject, t.priority, t.location, s.name as site from tickets t left join sites s on s.id = t.site_id where t.id = $1', [id]);
          await notify(c, [tech.id], `ได้รับมอบหมายงาน${x.priority === 'urgent' ? ' · ด่วนมาก' : ''}`,
            `${x.subject} — ${x.site ?? '-'}${x.location ? ` · ${x.location}` : ''}`, id);
          return true;
        });
        return done ? send(res, 200, { ok: true }) : send(res, 409, { error: 'status_changed' });
      }
      if (action === 'resolve') {
        if (!canResolve(me, t)) return send(res, 403, { error: 'forbidden' });
        const summary = String(body.summary ?? '').trim();
        const parts = String(body.parts ?? '').trim().slice(0, 1000);
        const hours = Number(body.hours ?? 0);
        if (!summary || summary.length > 2000) return send(res, 400, { error: 'invalid_text' });
        if (!Number.isFinite(hours) || hours < 0 || hours > 999) return send(res, 400, { error: 'invalid_hours' });
        const done = await inTx(async c => {
          const r = await c.query("update tickets set status = 'resolved', version = version + 1 where id = $1 and status = $2", [id, t.status]);
          if (r.rowCount === 0) return false;
          // งานที่เคยลงนามแล้วถูกเปิดใหม่: ลายเซ็นและคะแนนเดิมใช้กับใบรายงานใหม่ไม่ได้
          await c.query('delete from ratings where ticket_id = $1', [id]);
          await c.query('delete from signoffs where ticket_id = $1', [id]);
          await c.query(`insert into reports (ticket_id, no, summary, parts, hours, by_user)
                         values ($1, 'SR-' || extract(year from now())::int || '-' || lpad(nextval('report_seq')::text, 4, '0'), $2, $3, $4, $5)
                         on conflict (ticket_id) do update set summary = excluded.summary, parts = excluded.parts,
                           hours = excluded.hours, by_user = excluded.by_user, at = now()`, [id, summary, parts, hours, me.id]);
          await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, reason) values ($1, $2, $3, $4, $5)',
            [id, t.status, 'resolved', me.id, summary.slice(0, 500)]);
          // รูปหลังซ่อมของใบรายงานใหม่แทนชุดเดิม (งานที่ถูกเปิดซ้ำแล้วทำเสร็จอีกครั้ง)
          await c.query('delete from photos where id like $1', [`${id}:r:%`]);
          await savePhotos(c, id, 'r', photos);
          await audit(c, me, `ออกใบรายงาน ${id}`, '→ รอลูกค้าเซ็นรับ');
          // ให้ลูกค้าเซ็นในแอป: แจ้งทุกคนในบริษัท · เซ็นหน้างานทันที (signNow) ไม่ต้องแจ้ง
          if (body.signNow !== true) {
            const { rows: [x] } = await c.query('select subject, customer_id from tickets where id = $1', [id]);
            await notify(c, await companyUsers(c, x.customer_id), 'งานเสร็จแล้ว — กรุณาเซ็นรับ', x.subject, id);
          }
          return true;
        });
        return done ? send(res, 200, { ok: true }) : send(res, 409, { error: 'status_changed' });
      }
      if (action === 'signoff') {
        const { rows: [rep] } = await pool.query(
          'select s.via, s.at from reports r left join signoffs s on s.ticket_id = r.ticket_id where r.ticket_id = $1', [id]);
        const sState = { report: !!rep, signed: rep?.via ? { via: rep.via, at: rep.at } : null, rated: false };
        if (!canSignOff(me, t, sState)) return send(res, 403, { error: 'forbidden' });
        const name = String(body.name ?? '').trim().slice(0, 100);
        const position = String(body.position ?? '').trim().slice(0, 100);
        const sig = String(body.signature ?? '');
        if (!name) return send(res, 400, { error: 'invalid_name' });
        if (!validPng(sig)) return send(res, 400, { error: 'invalid_signature' });
        // ลูกค้าลงนามเอง = app · ช่างยื่นเครื่องให้เซ็นหน้างาน = onsite
        const via = me.role === 'customer' ? 'app' : 'onsite';
        const label = via === 'app' ? 'ลูกค้าลงนามรับงาน' : 'ลูกค้าลงนามรับงานหน้างาน';
        const done = await inTx(async c => {
          const r = await c.query("update tickets set status = 'closed', version = version + 1 where id = $1 and status = 'resolved'", [id]);
          if (r.rowCount === 0) return false;
          await c.query('insert into signoffs (ticket_id, name, position, via, by_user, signature) values ($1, $2, $3, $4, $5, $6)',
            [id, name, position, via, me.id, sig]);
          await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, reason) values ($1, $2, $3, $4, $5)',
            [id, 'resolved', 'closed', me.id, `${label} (${name})`]);
          await audit(c, me, `${label} ${id}`, name);
          return true;
        });
        return done ? send(res, 200, { ok: true }) : send(res, 409, { error: 'status_changed' });
      }
      if (action === 'rating') {
        const { rows: [rep] } = await pool.query(`
          select s.via, s.at, (rt.ticket_id is not null) as rated
          from reports r
          left join signoffs s on s.ticket_id = r.ticket_id
          left join ratings rt on rt.ticket_id = r.ticket_id
          where r.ticket_id = $1`, [id]);
        const sState = { report: !!rep, signed: rep?.via ? { via: rep.via, at: rep.at } : null, rated: !!rep?.rated };
        if (!canRate(me, t, sState)) return send(res, 403, { error: 'forbidden' });
        const score = Number(body.score);
        if (!Number.isInteger(score) || score < 1 || score > 5) return send(res, 400, { error: 'invalid_score' });
        const comment = String(body.comment ?? '').trim().slice(0, 500);
        const via = me.role === 'customer' ? 'app' : 'onsite';
        const r = await pool.query(
          'insert into ratings (ticket_id, score, comment, by_user, via) values ($1, $2, $3, $4, $5) on conflict (ticket_id) do nothing',
          [id, score, comment, me.id, via]);
        return r.rowCount ? send(res, 200, { ok: true }) : send(res, 409, { error: 'already_rated' });
      }
      if (action === 'comments') {
        // ลูกค้าโพสต์ได้เฉพาะความเห็นสาธารณะ
        const vis = body.vis === 'internal' ? 'internal' : 'public';
        if (vis === 'internal' && !isStaff(me)) return send(res, 403, { error: 'forbidden' });
        // ส่งรูปอย่างเดียวได้
        if ((!text && !photos.length) || text.length > 2000) return send(res, 400, { error: 'invalid_text' });
        await inTx(async c => {
          const { rows: [cm] } = await c.query('insert into comments (ticket_id, by_user, vis, text) values ($1, $2, $3, $4) returning id', [id, me.id, vis, text]);
          await savePhotos(c, id, `c${cm.id}`, photos);
        });
        return send(res, 200, { ok: true });
      }
      if (action === 'worklog') {
        if (!canWorklog(me, t)) return send(res, 403, { error: 'forbidden' });
        if ((!text && !photos.length) || text.length > 2000) return send(res, 400, { error: 'invalid_text' });
        await inTx(async c => {
          const { rows: [w] } = await c.query('insert into worklogs (ticket_id, by_user, text) values ($1, $2, $3) returning id', [id, me.id, text]);
          const pids = await savePhotos(c, id, `w${w.id}`, photos);
          if (pids.length) await c.query('update worklogs set photo_ids = $2 where id = $1', [w.id, pids]);
          if (pids.length) await audit(c, me, `บันทึก Work log ${id}`, `แนบรูป ${pids.length} รูป`);
        });
        return send(res, 200, { ok: true });
      }
    }
    // บัญชีผู้ใช้: POST /api/users = เพิ่ม · POST /api/users/:id = แก้ไข/ปิดบัญชี
    // ผู้ดูแลจัดการได้ทุกบทบาท · หัวหน้าทีมจัดการได้เฉพาะช่าง (หน้าทีมช่าง)
    const userUrl = req.method === 'POST' && (req.url === '/api/users' ? [] : req.url.match(/^\/api\/users\/([\w-]{1,40})$/));
    if (userUrl) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      // ตัวแทนบริษัท (approver) เพิ่มพนักงานของบริษัทตัวเองได้ทันที — ไม่แก้ไข/ลบ และห้ามเลือกบริษัทอื่น
      const rep = me.role === 'customer' && !!me.approver && !userUrl[1];
      if (me.role !== 'admin' && !canManageTeam(me) && !rep) return send(res, 403, { error: 'forbidden' });
      const id = userUrl[1];
      const b = await readJson(req, PHOTO_BODY);
      const name = String(b.name ?? '').trim();
      const email = String(b.email ?? '').trim().toLowerCase();
      const role = String(b.role ?? '');
      const password = String(b.password ?? '');
      const phone = String(b.phone ?? '').replace(/[\s-]/g, '');
      const customerId = role === 'customer' ? String(b.customerId ?? '') : null;
      const siteId = role === 'customer' && b.siteId ? String(b.siteId) : null;
      const isTech = role === 'technician';
      // หัวหน้าทีมเพิ่มช่างได้เฉพาะเข้าทีมตัวเอง
      const team = isTech || role === 'team_leader' ? (me.role === 'admin' ? String(b.team ?? '').trim().slice(0, 20) : me.team) || 'T1' : null;
      const skills = isTech && Array.isArray(b.skills) ? [...new Set(b.skills.filter(k => CATEGORIES.includes(k)))] : [];
      const approver = role === 'customer' && b.approver === true;   // ตัวแทนบริษัท: อนุมัติพนักงานของบริษัทตัวเองได้
      const removed = b.removed === true;
      const photos = parsePhotos(b.photo ? [b.photo] : [], 1);
      if (photos === null) return send(res, 400, { error: 'invalid_photo' });
      if (rep && (role !== 'customer' || customerId !== me.customer_id || b.approver === true)) return send(res, 403, { error: 'forbidden' });
      if (me.role !== 'admin' && !isTech && !rep) return send(res, 403, { error: 'forbidden' });
      if (!name || name.length > 100) return send(res, 400, { error: 'invalid_name' });
      if (email.length > 100 || !EMAIL.test(email)) return send(res, 400, { error: 'invalid_email' });
      if (phone && !/^\+?\d{9,15}$/.test(phone)) return send(res, 400, { error: 'invalid_phone' });
      if (!ROLES.includes(role)) return send(res, 400, { error: 'invalid_role' });
      // บัญชีใหม่ต้องมีรหัส · บัญชีเดิมเว้นว่าง = ใช้รหัสเดิม (ยาวสุด 200 ตามที่หน้าเข้าสู่ระบบรับ)
      if ((!id || password) && (password.length < 8 || password.length > 200)) return send(res, 400, { error: 'invalid_new_password' });
      if (role === 'customer' && !customerId) return send(res, 400, { error: 'invalid_company' });
      // กันผู้ดูแลล็อกตัวเองออก — จึงมีผู้ดูแลเหลืออย่างน้อย 1 คนเสมอ
      if (id === me.id && (role !== me.role || removed)) return send(res, 400, { error: 'self_lockout' });
      try {
        const saved = await inTx(async c => {
          if (siteId && !(await c.query('select 1 from sites where id = $1 and customer_id = $2', [siteId, customerId])).rowCount) return 'invalid_site';
          if (id && me.role !== 'admin') {
            // หัวหน้าทีมแก้ได้เฉพาะบัญชีที่เป็นช่างอยู่แล้ว
            const { rows: [x] } = await c.query('select role from users where id = $1', [id]);
            if (x?.role !== 'technician') return 'forbidden';
          }
          const hash = password ? await hashPassword(password) : null;
          let uid = id;
          if (id) {
            const r = await c.query(`update users set name = $2, email = $3, role = $4, team = $5, customer_id = $6, site_id = $7, approver = $8,
                                       removed = $9, phone = $10, skills = $11, password_hash = coalesce($12, password_hash) where id = $1`,
              [id, name, email, role, team, customerId, siteId, approver, removed, phone || null, skills, hash]);
            if (!r.rowCount) return 'not_found';
            // ตั้งรหัสใหม่ = ออกจากระบบทุกเครื่องของคนนั้น (ยกเว้นเครื่องที่กำลังใช้อยู่)
            if (hash) await c.query('delete from sessions where user_id = $1 and token_hash <> $2', [id, hashToken(sessionToken(req))]);
          } else {
            await c.query(`insert into users (id, name, email, role, team, customer_id, site_id, approver, phone, skills, password_hash)
                           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [uid = `u${randomBytes(4).toString('hex')}`, name, email, role, team, customerId, siteId, approver, phone || null, skills, hash]);
          }
          if (photos.length) {
            await c.query('delete from photos where id like $1', [`${uid}:u:%`]);
            await savePhotos(c, uid, 'u', photos);
          }
          await audit(c, me, id ? (removed ? 'ปิดบัญชี' : 'แก้ไขบัญชี') : 'เพิ่มบัญชี', `${email} (${role})${hash && id ? ' ตั้งรหัสใหม่' : ''}`);
          return 'ok';
        });
        const code = { ok: 200, not_found: 404, forbidden: 403 }[saved] ?? 400;
        return send(res, code, saved === 'ok' ? { ok: true } : { error: saved });
      } catch (err) {
        if (err.code === '23505') return send(res, 409, { error: 'email_taken' });       // อีเมลซ้ำ
        if (err.code === '23503') return send(res, 400, { error: 'invalid_company' });   // บริษัทไม่มีอยู่จริง
        throw err;
      }
    }
    // พาร์ทเนอร์ (บริษัทลูกค้า) และสถานที่ — หัวหน้าทีม/ผู้ดูแล
    // POST /api/customers = เพิ่ม (พร้อมสถานที่แรก และตัวแทนบริษัทถ้าระบุ) · /api/customers/:id = แก้ไข
    // POST /api/customers/:id/sites = เพิ่มสถานที่ · /api/customers/:id/sites/:sid = แก้ไขสถานที่
    const custUrl = req.method === 'POST' && req.url.match(/^\/api\/customers(?:\/([\w-]{1,40})(?:\/sites(?:\/([\w-]{1,40}))?)?)?$/);
    if (custUrl) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      if (!canManagePartners(me)) return send(res, 403, { error: 'forbidden' });
      const [path, cid, sid] = custUrl;
      const b = await readJson(req);
      const txt = (v, n = 100) => String(v ?? '').trim().slice(0, n);
      const siteOf = x => ({ name: txt(x?.name), address: txt(x?.address, 300), contact: txt(x?.contact), phone: txt(x?.phone, 20) });
      try {
        const out = await inTx(async c => {
          if (path.includes('/sites')) {
            const s = siteOf(b);
            if (!s.name || !s.address) return 'invalid_site';
            if (sid) {
              const r = await c.query('update sites set name = $3, address = $4, contact = $5, phone = $6 where id = $1 and customer_id = $2',
                [sid, cid, s.name, s.address, s.contact || null, s.phone || null]);
              if (!r.rowCount) return 'not_found';
            } else {
              await c.query('insert into sites (id, customer_id, name, address, contact, phone) values ($1, $2, $3, $4, $5, $6)',
                [`S${randomBytes(4).toString('hex')}`, cid, s.name, s.address, s.contact || null, s.phone || null]);
            }
            await audit(c, me, `${sid ? 'แก้ไข' : 'เพิ่ม'}สถานที่`, s.name);
            return 'ok';
          }
          const d = { name: txt(b.name), contract: ['ma', 'oncall', 'project'].includes(b.contract) ? b.contract : null,
            contact: txt(b.contact), phone: txt(b.phone, 20), email: txt(b.email) };
          if (!d.name) return 'invalid_name';
          let id = cid;
          if (cid) {
            const r = await c.query('update customers set name = $2, contract = $3, contact = $4, phone = $5, email = $6 where id = $1',
              [cid, d.name, d.contract, d.contact || null, d.phone || null, d.email || null]);
            if (!r.rowCount) return 'not_found';
          } else {
            const s = siteOf(b.site);
            if (!s.name || !s.address) return 'invalid_site';
            id = `C${randomBytes(4).toString('hex')}`;
            await c.query('insert into customers (id, name, contract, contact, phone, email) values ($1, $2, $3, $4, $5, $6)',
              [id, d.name, d.contract, d.contact || null, d.phone || null, d.email || null]);
            await c.query('insert into sites (id, customer_id, name, address, contact, phone) values ($1, $2, $3, $4, $5, $6)',
              [`S${randomBytes(4).toString('hex')}`, id, s.name, s.address, d.contact || null, d.phone || null]);
          }
          // ตัวแทนบริษัท = บัญชีลูกค้าคนแรกของบริษัท (approver) เข้าระบบด้วยอีเมลและรหัสผ่านเริ่มต้นที่ตั้งให้
          const rep = txt(b.repEmail).toLowerCase(), repPw = String(b.repPassword ?? '');
          if (rep) {
            if (!EMAIL.test(rep)) return 'invalid_email';
            if (!d.contact) return 'invalid_name';
            if (repPw.length < 8 || repPw.length > 200) return 'invalid_new_password';
            const { rows: [s0] } = await c.query('select id from sites where customer_id = $1 order by id limit 1', [id]);
            await c.query(`insert into users (id, name, email, role, customer_id, site_id, approver, password_hash)
                           values ($1, $2, $3, 'customer', $4, $5, true, $6)`, [`u${randomBytes(4).toString('hex')}`, d.contact, rep, id, s0?.id ?? null, await hashPassword(repPw)]);
          }
          await audit(c, me, cid ? 'แก้ไขพาร์ทเนอร์' : 'เพิ่มพาร์ทเนอร์', d.name + (rep ? ` · ตัวแทน ${rep}` : ''));
          return { id };
        });
        if (typeof out === 'object') return send(res, 200, out);
        return send(res, out === 'ok' ? 200 : out === 'not_found' ? 404 : 400, out === 'ok' ? { ok: true } : { error: out });
      } catch (err) {
        if (err.code === '23505') return send(res, 409, { error: 'email_taken' });
        if (err.code === '23503') return send(res, 404, { error: 'not_found' });   // บริษัทของสถานที่ไม่มีอยู่จริง
        throw err;
      }
    }
    // รูปแนบ: ตรวจสิทธิ์จากเจ้าของรูปทุกครั้ง (ลูกค้าไม่เห็นรูปใน work log และในบันทึกภายใน)
    const photoUrl = req.method === 'GET' && req.url.match(/^\/api\/photos\/([^/?]{1,80})$/);
    if (photoUrl) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const pid = decodeURIComponent(photoUrl[1]);
      const [, owner, kind, n] = PHOTO_ID.exec(pid) ?? [];
      let ok = false;
      if ('tcwr'.includes(kind) && await visibleTicket(me, owner)) {
        ok = isStaff(me) || kind === 't' || kind === 'r'
          || (kind === 'c' && (await pool.query("select 1 from comments where id = $1 and ticket_id = $2 and vis = 'public'", [n || '0', owner])).rowCount > 0);
      } else if (kind === 'u') {
        const { rows: [x] } = await pool.query('select role, customer_id from users where id = $1', [owner]);
        ok = !!x && (isStaff(me) || x.role !== 'customer' || x.customer_id === me.customer_id);
      } else if (kind === 'j') {
        const { rows: [x] } = await pool.query('select customer_id from join_requests where id = $1', [owner]);
        ok = !!x && canApproveMembers(me, x.customer_id);
      }
      const ph = ok ? (await pool.query('select data from photos where id = $1', [pid])).rows[0] : null;
      if (!ph) return send(res, 404, { error: 'not_found' });
      // รหัสรูปไม่ซ้ำและรูปไม่ถูกแก้ จึงให้เบราว์เซอร์เก็บไว้ได้ (เฉพาะเครื่องนี้)
      res.writeHead(200, { 'content-type': 'image/jpeg', 'cache-control': 'private, max-age=3600' });
      return res.end(Buffer.from(ph.data.slice(ph.data.indexOf(',') + 1), 'base64'));
    }
    // การแจ้งเตือนของฉัน: GET = รายการล่าสุด (หน้าเว็บถามทุก 30 วินาที) · POST read = อ่านแล้ว (ระบุ id หรือทั้งหมด)
    if (req.url === '/api/notifications' || req.url === '/api/notifications/read') {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      if (req.method === 'GET' && req.url === '/api/notifications') {
        const { rows } = await pool.query('select id, title, body, ticket_id, go, read, at from notifications where to_user = $1 order by at desc limit 100', [me.id]);
        return send(res, 200, { notifs: rows.map(x => ({ id: x.id, to: me.id, title: x.title, body: x.body, ticketId: x.ticket_id, go: x.go, read: x.read, at: x.at })) });
      }
      if (req.method === 'POST' && req.url === '/api/notifications/read') {
        const b = await readJson(req);
        const id = typeof b.id === 'string' ? b.id.slice(0, 40) : null;
        await pool.query('update notifications set read = true where to_user = $1 and read = false and ($2::text is null or id = $2)', [me.id, id]);
        return send(res, 200, { ok: true });
      }
    }
    // โปรเจกต์: POST /api/projects = สร้าง (หัวหน้าทีม/ผู้ดูแล) · /api/projects/:id/tasks = เพิ่มขั้นตอน · /tasks/:tid = ติ๊กเสร็จ/ยกเลิก
    const pjUrl = req.method === 'POST' && req.url.match(/^\/api\/projects(?:\/([\w-]{1,40})\/tasks(?:\/(\d{1,18}))?)?$/);
    if (pjUrl) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const [, pid, taskId] = pjUrl;
      const b = await readJson(req);
      if (!pid) {
        if (!isManager(me)) return send(res, 403, { error: 'forbidden' });
        const name = String(b.name ?? '').trim(), due = String(b.due ?? ''), category = String(b.category ?? '');
        const customerId = String(b.customerId ?? ''), siteId = String(b.siteId ?? ''), ownerId = String(b.ownerId ?? '');
        const tasks = (Array.isArray(b.tasks) ? b.tasks : []).map(x => String(x ?? '').trim().slice(0, 120)).filter(Boolean);
        if (!name || name.length > 120) return send(res, 400, { error: 'invalid_name' });
        if (!CATEGORIES.includes(category)) return send(res, 400, { error: 'invalid_category' });
        if (!/^\d{4}-\d\d-\d\d$/.test(due) || Number.isNaN(Date.parse(due))) return send(res, 400, { error: 'invalid_date' });
        if (tasks.length > 50) return send(res, 400, { error: 'invalid_text' });
        const out = await inTx(async c => {
          const { rows: [site] } = await c.query('select s.id, cu.name as cust from sites s join customers cu on cu.id = s.customer_id where s.id = $1 and s.customer_id = $2', [siteId, customerId]);
          if (!site) return 'invalid_site';
          if (!(await c.query("select 1 from users where id = $1 and role = 'technician' and removed = false", [ownerId])).rowCount) return 'invalid_assignee';
          const id = `PJ${randomBytes(4).toString('hex')}`;
          await c.query('insert into projects (id, name, category, customer_id, site_id, owner_id, due) values ($1, $2, $3, $4, $5, $6, $7)',
            [id, name, category, customerId, siteId, ownerId, due]);
          for (let i = 0; i < tasks.length; i++) await c.query('insert into project_tasks (project_id, position, text) values ($1, $2, $3)', [id, i + 1, tasks[i]]);
          await notify(c, [ownerId], 'ได้รับมอบหมายโปรเจกต์', `${name} — ${site.cust}`, null, 'projects');
          await audit(c, me, 'สร้างโปรเจกต์', name);
          return { id };
        });
        return typeof out === 'object' ? send(res, 200, out) : send(res, 400, { error: out });
      }
      const { rows: [p] } = await pool.query('select id, name, customer_id, owner_id from projects where id = $1', [pid]);
      if (!p) return send(res, 404, { error: 'not_found' });
      if (!canEditProject(me, p)) return send(res, 403, { error: 'forbidden' });
      if (!taskId) {
        const text = String(b.text ?? '').trim();
        if (!text || text.length > 120) return send(res, 400, { error: 'invalid_text' });
        await inTx(async c => {
          await c.query('select 1 from projects where id = $1 for update', [pid]);   // กันสองคนได้ลำดับเดียวกัน
          await c.query('insert into project_tasks (project_id, position, text) select $1, coalesce(max(position), 0) + 1, $2 from project_tasks where project_id = $1', [pid, text]);
        });
        return send(res, 200, { ok: true });
      }
      const done = b.done === true;
      const ok = await inTx(async c => {
        const { rows: [t] } = await c.query('update project_tasks set done = $3 where id = $1 and project_id = $2 returning text', [taskId, pid, done]);
        if (!t) return false;
        await audit(c, me, `โปรเจกต์ ${p.name}`, `${done ? '✓' : '↺'} ${t.text}`);
        // ขั้นสุดท้ายเสร็จ: แจ้งลูกค้าของบริษัทและหัวหน้าทีม/ผู้ดูแล
        const { rows: [s] } = await c.query('select count(*) filter (where not done)::int as left from project_tasks where project_id = $1', [pid]);
        if (done && s.left === 0)
          await notify(c, [...await companyUsers(c, p.customer_id), ...await dispatchers(c)].filter(x => x !== me.id), 'โปรเจกต์เสร็จแล้ว', p.name, null, 'projects');
        return true;
      });
      return ok ? send(res, 200, { ok: true }) : send(res, 404, { error: 'not_found' });
    }
    // ค้นหาบริษัทสำหรับสมัคร (ไม่ต้องเข้าสู่ระบบ): รหัสตรงตัว หรือชื่อที่พิมพ์ ≥ 3 ตัว ไม่เกิน 5 ราย กันคนนอกไล่ดูรายชื่อลูกค้า
    // shortcut: อ่านรายชื่อลูกค้าทั้งหมดมากรองในหน่วยความจำ — ใช้ได้เมื่อลูกค้าหลักร้อย ถ้าเกินให้ค้นด้วย SQL
    if (req.method === 'GET' && req.url.startsWith('/api/companies?')) {
      const q = (new URL(req.url, 'http://x').searchParams.get('q') ?? '').trim();
      if (q.length > 60) return send(res, 400, { error: 'invalid_text' });
      const norm = s => s.toLowerCase().replace(/บริษัท|จำกัด|\(มหาชน\)|มหาชน|\s|\./g, '');
      const key = norm(q);
      if (!key) return send(res, 200, []);
      const { rows } = await pool.query('select id, name from customers order by name');
      return send(res, 200, rows.filter(c => c.id.toLowerCase() === q.toLowerCase() || (key.length >= 3 && norm(c.name).includes(key))).slice(0, 5));
    }
    // สมัครผ่านลิงก์ชวนหรือค้นหาบริษัท: ผู้สมัครตั้งรหัสเอง บัญชีจะถูกปิดไว้ก่อนจนกว่าตัวแทนบริษัทจะยอมรับ
    // shortcut: ลิงก์ใช้รหัสบริษัทตรง ๆ — ระบบจริงควรใช้โทเคนที่ยกเลิก/หมดอายุได้
    const joinUrl = req.url.match(/^\/api\/join\/([\w-]{1,40})$/);
    if (joinUrl) {
      const cid = joinUrl[1];
      const { rows: [co] } = await pool.query('select id, name from customers where id = $1', [cid]);
      if (!co) return send(res, 404, { error: 'not_found' });
      if (req.method === 'GET') {
        const { rows: sites } = await pool.query('select id, name from sites where customer_id = $1 order by id', [cid]);
        return send(res, 200, { id: co.id, name: co.name, sites });
      }
      if (req.method !== 'POST') return send(res, 404, { error: 'not_found' });
      const b = await readJson(req, PHOTO_BODY);
      const name = String(b.name ?? '').trim(), email = String(b.email ?? '').trim().toLowerCase(), phone = String(b.phone ?? '').replace(/[\s-]/g, '');
      const password = String(b.password ?? '');
      const photos = parsePhotos(b.photo ? [b.photo] : [], 1);
      if (!name || name.length > 80) return send(res, 400, { error: 'invalid_name' });
      if (email.length > 100 || !EMAIL.test(email)) return send(res, 400, { error: 'invalid_email' });
      if (!/^0\d{8,9}$/.test(phone)) return send(res, 400, { error: 'invalid_phone' });
      if (password.length < 8 || password.length > 200) return send(res, 400, { error: 'invalid_new_password' });
      if (!photos) return send(res, 400, { error: 'invalid_photo' });
      const out = await inTx(async c => {
        await c.query('select 1 from customers where id = $1 for update', [cid]);   // กันส่งคำขอซ้ำพร้อมกัน
        const { rows: [site] } = b.siteId
          ? await c.query('select id from sites where id = $1 and customer_id = $2', [String(b.siteId), cid])
          : await c.query('select id from sites where customer_id = $1 order by id limit 1', [cid]);
        if (b.siteId && !site) return 'invalid_site';
        const { rows: [q] } = await c.query(`select count(*)::int as n, count(*) filter (where email = $2 or phone = $3)::int as dup
                                             from join_requests where customer_id = $1 and status = 'pending'`, [cid, email, phone]);
        if (q.dup) return 'join_pending';
        if (q.n >= 50) return 'join_busy';   // กันคนนอกยิงคำขอไม่หยุด
        if ((await c.query('select 1 from users where email = $1', [email])).rowCount) return 'email_taken';
        const uid = `u${randomBytes(4).toString('hex')}`;
        await c.query(`insert into users (id, name, email, role, customer_id, site_id, phone, password_hash, removed)
                       values ($1, $2, $3, 'customer', $4, $5, $6, $7, true)`, [uid, name, email, cid, site?.id ?? null, phone, await hashPassword(password)]);
        const id = `J${randomBytes(4).toString('hex')}`;
        const [photoId] = await savePhotos(c, id, 'j', photos);
        await c.query('insert into join_requests (id, customer_id, site_id, name, email, phone, photo_id) values ($1, $2, $3, $4, $5, $6, $7)',
          [id, cid, site?.id ?? null, name, email, phone, photoId ?? null]);
        const { rows: aps } = await c.query("select id from users where customer_id = $1 and role = 'customer' and approver and removed = false", [cid]);
        await notify(c, aps.map(a => a.id), 'คำขอเข้าใช้งานใหม่', `${name} ขอเข้าใช้งานในนาม ${co.name}`, null, 'home');
        return 'ok';
      });
      const code = { ok: 200, join_pending: 409, join_busy: 429, email_taken: 409 }[out] ?? 400;
      return send(res, code, out === 'ok' ? { ok: true } : { error: out });
    }
    // ตัวแทนบริษัทกดยอมรับ/ปฏิเสธคำขอสมัคร: ยอมรับ = เปิดบัญชีที่รอไว้ · ปฏิเสธ = ลบบัญชีที่รอไว้ (อีเมลจะใช้สมัครใหม่ได้)
    const jrUrl = req.method === 'POST' && req.url.match(/^\/api\/join-requests\/(J[0-9a-f]{1,16})$/);
    if (jrUrl) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const b = await readJson(req);
      const ok = b.ok === true;
      const { rows: [r] } = await pool.query("select * from join_requests where id = $1 and status = 'pending'", [jrUrl[1]]);
      if (!r || !canApproveMembers(me, r.customer_id)) return send(res, 404, { error: 'not_found' });
      const done = await inTx(async c => {
        const u = await c.query("update join_requests set status = $2, decided_by = $3, decided_at = now() where id = $1 and status = 'pending'",
          [r.id, ok ? 'approved' : 'rejected', me.id]);
        if (!u.rowCount) return false;
        const { rows: [acc] } = await c.query('select id from users where email = $1 and customer_id = $2 and removed = true', [r.email, r.customer_id]);
        if (acc && ok) {
          await c.query('update users set removed = false where id = $1', [acc.id]);
          // รูปที่แนบตอนสมัครเป็นรูปโปรไฟล์
          if (r.photo_id) await c.query('insert into photos (id, data) select $1, data from photos where id = $2', [`${acc.id}:u:${randomBytes(6).toString('hex')}`, r.photo_id]);
        } else if (acc) {
          await c.query('delete from users where id = $1', [acc.id]);
        }
        const { rows: [co] } = await c.query('select name from customers where id = $1', [r.customer_id]);
        await audit(c, me, `${ok ? 'อนุมัติ' : 'ปฏิเสธ'}สมาชิกใหม่`, `${r.name} · ${co.name}`);
        return true;
      });
      return done ? send(res, 200, { ok: true }) : send(res, 404, { error: 'not_found' });
    }
    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err.message);
    send(res, 500, { error: 'server' });
  }
}).listen(port, () => console.log(`backend: http://localhost:${port}`));
