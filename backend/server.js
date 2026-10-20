// API ของ Guru IT Service Desk — ต่อ PostgreSQL (ตาราง users, sessions ใน db/schema.sql)
import http from 'node:http';
import pg from 'pg';
import { hashPassword, verifyPassword, hashToken, newToken } from './auth.js';
import { isStaff, isManager, canTransition, canAssign, canAssignTech, canWorklog, canResolve, canSignOff, canRate, actionsFor } from './rules.js';

const port = Number(process.env.PORT || 4000);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOKIE = 'gd_session';
const SESSION_HOURS = 12;
// ใช้ตรวจรหัสเมื่อไม่มีบัญชี เพื่อให้เวลาตอบใกล้เคียงกัน (กันเดาว่าอีเมลไหนมีบัญชี)
const DUMMY_HASH = await hashPassword('dummy-password-for-timing');

const send = (res, code, body, headers = {}) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', ...headers });
  res.end(JSON.stringify(body));
};
// ข้อมูลจากเบราว์เซอร์ไม่น่าเชื่อถือ: จำกัดขนาด (ภาษาไทย 1 ตัว = 3 ไบต์ ข้อความ 2000 ตัวจึงเกิน 4 KB) และถ้า JSON เสียให้ถือว่าว่าง
const readJson = req => new Promise(resolve => {
  let s = '';
  req.on('data', c => { s += c; if (s.length > 262144) req.destroy(); });   // ลายเซ็นเป็นรูป PNG แบบ base64 จึงต้องใหญ่กว่าข้อความทั่วไป
  req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
});
const sessionToken = req => (req.headers.cookie ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`))?.[1] ?? null;
const cookie = (value, maxAge) => `${COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const scopeOf = u => (isManager(u) ? 'all' : u.role);

// ลายเซ็นต้องเป็นไฟล์ PNG จริง: มี signature ของ PNG และ chunk IHDR ตามหลัง (ไม่ใช่แค่ข้อความที่หน้าตาคล้าย)
const PNG_MAGIC = Buffer.from('89504e470d0a1a0a', 'hex');
function validPng(sig) {
  const m = /^data:image\/png;base64,([A-Za-z0-9+/=]{32,200000})$/.exec(sig);
  if (!m) return false;
  const b = Buffer.from(m[1], 'base64');
  return b.length >= 33 && b.subarray(0, 8).equals(PNG_MAGIC) && b.subarray(12, 16).toString('latin1') === 'IHDR';
}

// ผู้ใช้ที่เข้าสู่ระบบอยู่ (จาก session ที่ยังไม่หมดอายุ) หรือ null
async function currentUser(req) {
  const t = sessionToken(req);
  if (!t) return null;
  const { rows: [u] } = await pool.query(
    `select u.id, u.name, u.role, u.team, u.customer_id from sessions s
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
      if (!pw || pw.length > 200) return send(res, 400, { error: 'invalid_password' });

      const { rows: [u] } = await pool.query(
        'select id, name, role, password_hash from users where email = $1 and removed = false', [e]);
      const ok = await verifyPassword(pw, u?.password_hash ?? DUMMY_HASH);
      if (!u || !u.password_hash || !ok) return send(res, 401, { error: 'bad_credentials' });

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
    if (req.method === 'GET' && req.url === '/api/home') {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const { rows } = await pool.query(`
        select t.id, t.type, t.subject, t.priority, t.status, t.created_at,
               c.name as customer, u.name as assignee
        from tickets t
        join customers c on c.id = t.customer_id
        left join users u on u.id = t.assignee_id
        where ($1 = 'all')
           or ($1 = 'technician' and t.assignee_id = $2)
           or ($1 = 'customer' and t.customer_id = $3)
        order by case t.priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end, t.created_at desc
        limit 50`, [scopeOf(me), me.id, me.customer_id]);
      return send(res, 200, rows);
    }
    if (req.method === 'GET' && req.url.startsWith('/api/tickets/')) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const id = decodeURIComponent(req.url.slice('/api/tickets/'.length));
      if (!/^T-\d{1,10}$/.test(id)) return send(res, 400, { error: 'invalid_ticket' });
      // กติกาเดียวกับหน้าหลัก: ไม่มีสิทธิ์ = 404 (ไม่บอกว่างานนั้นมีอยู่จริง)
      const { rows: [t] } = await pool.query(`
        select t.id, t.type, t.subject, t.category, t.priority, t.status, t.location, t.created_at,
               t.assignee_id, c.name as customer, s.name as site, u.name as assignee
        from tickets t
        join customers c on c.id = t.customer_id
        left join sites s on s.id = t.site_id
        left join users u on u.id = t.assignee_id
        where t.id = $1 and (($2 = 'all')
           or ($2 = 'technician' and t.assignee_id = $3)
           or ($2 = 'customer' and t.customer_id = $4))`, [id, scopeOf(me), me.id, me.customer_id]);
      if (!t) return send(res, 404, { error: 'not_found' });
      // ลูกค้าเห็นเฉพาะความเห็นสาธารณะ และไม่เห็น work log (ข้อมูลภายใน)
      const staff = isStaff(me);
      const [history, comments, worklogs, techs] = await Promise.all([
        pool.query(`select h.from_status, h.to_status, h.reason, h.at, u.name as by
                    from ticket_history h left join users u on u.id = h.by_user
                    where h.ticket_id = $1 order by h.at, h.id`, [id]),
        pool.query(`select c.vis, c.text, c.at, u.name as by
                    from comments c left join users u on u.id = c.by_user
                    where c.ticket_id = $1 ${staff ? '' : "and c.vis = 'public'"} order by c.at, c.id`, [id]),
        staff ? pool.query(`select w.text, cardinality(w.photo_ids) as photos, w.at, u.name as by
                            from worklogs w left join users u on u.id = w.by_user
                            where w.ticket_id = $1 order by w.at, w.id`, [id]) : { rows: [] },
        pool.query(`select id, name, team from users where role = 'technician' and removed = false order by name`),
      ]);
      const { rows: [rep] } = await pool.query(`
        select r.no, r.summary, r.parts, r.hours, r.at,
               s.name as sign_name, s.position as sign_position, s.via as sign_via, s.at as sign_at, s.signature,
               rt.score as rating_score, rt.comment as rating_comment
        from reports r
        left join signoffs s on s.ticket_id = r.ticket_id
        left join ratings rt on rt.ticket_id = r.ticket_id
        where r.ticket_id = $1`, [id]);
      const sState = { report: !!rep, signed: rep?.sign_via ? { via: rep.sign_via, at: rep.sign_at } : null, rated: rep?.rating_score != null };
      const actions = actionsFor(me, t, sState);
      const assignable = actions.assign ? techs.rows.filter(x => canAssignTech(me, x)) : [];
      return send(res, 200, { ticket: t, actions, assignable, report: rep ?? null, history: history.rows, comments: comments.rows, worklogs: worklogs.rows });
    }
    // การกระทำกับงาน: ตรวจสิทธิ์ทุกครั้งที่ server
    const act = req.method === 'POST' ? req.url.match(/^\/api\/tickets\/(T-\d{1,10})\/(status|assign|comments|worklog|resolve|signoff|rating)$/) : null;
    if (act) {
      const me = await currentUser(req);
      if (!me) return send(res, 401, { error: 'not_signed_in' });
      const [, id, action] = act;
      const t = await visibleTicket(me, id);
      if (!t) return send(res, 404, { error: 'not_found' });
      const body = await readJson(req);
      const text = String(body.text ?? '').trim();
      const reason = String(body.reason ?? '').trim().slice(0, 500) || null;

      if (action === 'status') {
        const to = String(body.to ?? '');
        // ทำเสร็จต้องมีใบรายงาน ใช้ /resolve เท่านั้น
        if (to === 'resolved') return send(res, 400, { error: 'use_resolve' });
        if (!canTransition(me, t, to)) return send(res, 403, { error: 'forbidden' });
        const done = await inTx(async c => {
          // เงื่อนไข status เดิมกันคนสองคนเปลี่ยนสถานะพร้อมกัน
          const r = await c.query('update tickets set status = $2, version = version + 1 where id = $1 and status = $3', [id, to, t.status]);
          if (r.rowCount === 0) return false;
          await c.query('insert into ticket_history (ticket_id, from_status, to_status, by_user, reason) values ($1, $2, $3, $4, $5)',
            [id, t.status, to, me.id, reason]);
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
        if (!text || text.length > 2000) return send(res, 400, { error: 'invalid_text' });
        await pool.query('insert into comments (ticket_id, by_user, vis, text) values ($1, $2, $3, $4)', [id, me.id, vis, text]);
        return send(res, 200, { ok: true });
      }
      if (action === 'worklog') {
        if (!canWorklog(me, t)) return send(res, 403, { error: 'forbidden' });
        if (!text || text.length > 2000) return send(res, 400, { error: 'invalid_text' });
        await pool.query('insert into worklogs (ticket_id, by_user, text) values ($1, $2, $3)', [id, me.id, text]);
        return send(res, 200, { ok: true });
      }
    }
    send(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error(err.message);
    send(res, 500, { error: 'server' });
  }
}).listen(port, () => console.log(`backend: http://localhost:${port}`));
