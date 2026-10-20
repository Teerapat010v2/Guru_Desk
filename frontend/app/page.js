"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// ข้อความเมื่อ backend ตอบปฏิเสธ (ตรงกับรหัสที่ backend/server.js ส่งกลับ)
const ERR = {
  invalid_email: "อีเมลไม่ถูกต้อง (เช่น name@company.com)",
  invalid_password: "กรุณากรอกรหัสผ่าน",
  bad_credentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  forbidden: "ไม่มีสิทธิ์ทำรายการนี้",
  status_changed: "สถานะงานเปลี่ยนไปแล้ว กรุณารีเฟรชหน้า",
  use_resolve: "กรุณาใช้ปุ่มทำเสร็จ (ต้องกรอกใบรายงาน)",
  invalid_assignee: "เลือกช่างที่มอบหมายไม่ได้",
  invalid_text: "ข้อความว่างหรือยาวเกินกำหนด",
  invalid_hours: "จำนวนชั่วโมงไม่ถูกต้อง (0–999)",
  invalid_name: "กรุณากรอกชื่อ (ไม่เกิน 100 ตัว)",
  invalid_signature: "กรุณาเซ็นชื่อในกรอบก่อน",
  invalid_score: "กรุณาเลือกคะแนน 1–5",
  already_rated: "งานนี้ให้คะแนนไปแล้ว",
  invalid_role: "กรุณาเลือกบทบาท",
  invalid_new_password: "รหัสผ่านต้องยาว 8–200 ตัว",
  invalid_company: "กรุณาเลือกบริษัท หรือกรอกชื่อบริษัทใหม่",
  self_lockout: "เปลี่ยนบทบาทหรือปิดบัญชีของตัวเองไม่ได้",
  email_taken: "อีเมลนี้มีบัญชีอยู่แล้ว",
  invalid_subject: "กรุณากรอกหัวข้อ (ไม่เกิน 120 ตัว)",
  invalid_category: "กรุณาเลือกหมวดปัญหา",
  invalid_priority: "กรุณาเลือกความสำคัญ",
};
const ROLE = { customer: "ลูกค้า", technician: "ช่างเทคนิค", team_leader: "หัวหน้าทีม", admin: "ผู้ดูแลระบบ" };
const STATUS = {
  new: "ใหม่", assigned: "มอบหมายแล้ว", in_progress: "กำลังดำเนินการ",
  pending: "พักงาน", resolved: "รอลูกค้าเซ็นรับ", closed: "ปิดงาน",
};
// ชื่อปุ่มตามสถานะที่จะไป
const GO = { in_progress: "เริ่มงาน / ทำต่อ", pending: "พักงาน", closed: "ปิดงานโดยไม่มีลายเซ็น" };
const PRIORITY = { urgent: "ด่วนมาก", high: "สูง", medium: "ปานกลาง", low: "ต่ำ" };
const CATEGORY = {
  printer: "เครื่องพิมพ์", network: "อินเทอร์เน็ต/เครือข่าย", account: "บัญชี/รหัสผ่าน",
  install: "ติดตั้งเครื่อง", repair: "ซ่อมอุปกรณ์", cctv: "กล้องวงจรปิด", other: "อื่น ๆ",
};
const TYPE = { service: "งานบริการ", complaint: "ร้องเรียน" };
const when = (s) => new Date(s).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

export default function Page() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [view, setView] = useState("home");

  // ถ้ามี session อยู่แล้ว (รีเฟรชหน้า) ให้เข้าหน้าหลักเลยโดยไม่ต้องกรอกรหัสใหม่
  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {})
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return null;
  if (!user) return <SignIn onDone={setUser} />;
  // ใช้ทั้งปุ่มออกจากระบบและตอน session หมดอายุ (ลบ session ที่ server ด้วยทุกครั้ง)
  const logout = () => {
    fetch("/api/logout", { method: "POST" }).catch(() => {});
    setUser(null); setOpenId(null); setView("home");
  };
  const go = (v) => { setOpenId(null); setView(v); };
  const nav = <Nav user={user} active={view} onGo={go} onLogout={logout} />;
  if (view === "users") return <Users nav={nav} me={user} onLogout={logout} />;
  return openId
    ? <Detail id={openId} user={user} nav={nav} onBack={() => setOpenId(null)} onLogout={logout} />
    : <Home user={user} nav={nav} onOpen={setOpenId} onLogout={logout} />;
}

function SignIn({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (r.ok) {
        setPassword("");
        onDone(data);
      } else {
        setErr(ERR[data.error] ?? "เซิร์ฟเวอร์มีปัญหา ลองใหม่อีกครั้ง");
      }
    } catch {
      setErr("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page">
      <form className="card" onSubmit={submit}>
        <Image src="/logo.png" alt="Guru IT Solution" width={96} height={28} unoptimized />
        <h1>เข้าสู่ระบบ</h1>
        <label>
          อีเมลที่ลงทะเบียน
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            placeholder="name@company.com"
            required
          />
        </label>
        <label>
          รหัสผ่าน
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {err && <p role="alert" className="err">{err}</p>}
        <button type="submit" disabled={busy}>
          {busy ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
        </button>
      </form>
    </main>
  );
}

function Home({ user, nav, onOpen, onLogout }) {
  const [tickets, setTickets] = useState(null);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);
  // ตรงกับ canCreateTicket ใน backend/rules.js (server ตรวจซ้ำ)
  const canCreate = user.role === "customer" || user.role === "team_leader" || user.role === "admin";

  useEffect(() => {
    fetch("/api/home")
      .then((r) => {
        if (r.status === 401) return onLogout();   // session หมดอายุ ให้กลับไปหน้าเข้าสู่ระบบ
        if (!r.ok) throw new Error(String(r.status));
        return r.json().then(setTickets);
      })
      .catch(() => setErr("โหลดงานไม่สำเร็จ ลองใหม่อีกครั้ง"));
    // โหลดครั้งเดียวตอนเข้าหน้า (ไม่ใส่ onLogout ใน dependency เพราะเปลี่ยนทุกครั้งที่ parent เรนเดอร์)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="home">
      {nav}
      <header className="top">
        <div>
          <p className="hint">{ROLE[user.role]}</p>
          <h1>สวัสดี คุณ{user.name}</h1>
        </div>
        {canCreate && !creating && (
          <button className="ghost" onClick={() => setCreating(true)}>{user.role === "customer" ? "+ แจ้งปัญหา" : "+ เปิดงานใหม่"}</button>
        )}
      </header>

      {creating && <NewTicket user={user} onLogout={onLogout} onCancel={() => setCreating(false)} onCreated={onOpen} />}

      <section className="card">
        <h2>งานของคุณ</h2>
        {err && <p role="alert" className="err">{err}</p>}
        {!err && tickets === null && <p className="hint">กำลังโหลด…</p>}
        {tickets?.length === 0 && <p className="hint">ยังไม่มีงาน</p>}
        {tickets?.map((t) => (
          <button key={t.id} className="job" onClick={() => onOpen(t.id)}>
            <div className="job-head">
              <b>{t.subject}</b>
              <span className={`prio ${t.priority}`}>{PRIORITY[t.priority]}</span>
            </div>
            <p className="hint">{t.id} · {t.customer}{t.type === "complaint" ? " · ร้องเรียน" : ""}</p>
            <p className="hint">{STATUS[t.status]}{t.assignee ? ` · ช่าง${t.assignee}` : " · ยังไม่มอบหมาย"}</p>
          </button>
        ))}
      </section>
    </main>
  );
}

// เปิดงานใหม่: ลูกค้าเล่าปัญหาช่องเดียว · หัวหน้าทีม/ผู้ดูแลกรอกครบและเลือกบริษัทลูกค้า
function NewTicket({ user, onLogout, onCancel, onCreated }) {
  const staff = user.role !== "customer";
  const [f, setF] = useState({ type: "service", desc: "", urgent: false, subject: "", category: "", priority: "medium", customerId: "", location: "" });
  const [customers, setCustomers] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  useEffect(() => {
    if (!staff) return;
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((cs) => { setCustomers(cs); setF((x) => ({ ...x, customerId: cs[0]?.id ?? "" })); })
      .catch(() => setMsg("โหลดรายชื่อบริษัทไม่สำเร็จ"));
  }, [staff]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
      });
      if (r.status === 401) return onLogout();
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return setMsg(ERR[d.error] ?? "เปิดงานไม่สำเร็จ");
      onCreated(d.id);
    } catch {
      setMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setBusy(false);
    }
  }

  const complaint = f.type === "complaint";
  return (
    <form className="card form" onSubmit={submit}>
      <h2>{staff ? "เปิดงานใหม่" : complaint ? "ร้องเรียน / ติชมบริการ" : "แจ้งปัญหา"}</h2>
      <label>
        ประเภทงาน
        <select value={f.type} onChange={set("type")}>
          <option value="service">{staff ? "งานบริการ" : "แจ้งปัญหา / ขอบริการ"}</option>
          <option value="complaint">ร้องเรียน / ติชมบริการ</option>
        </select>
      </label>
      {staff && (
        <>
          {customers?.length === 0 && <p className="hint">ยังไม่มีบริษัทลูกค้า — เพิ่มได้ที่เมนูจัดการบัญชี (บัญชีลูกค้า → บริษัทใหม่)</p>}
          <label>
            บริษัทลูกค้า
            <select value={f.customerId} onChange={set("customerId")} required>
              {(customers ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>หัวข้อ<input value={f.subject} onChange={set("subject")} maxLength={120} placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด" required /></label>
          <label>
            หมวดปัญหา
            <select value={f.category} onChange={set("category")} required>
              <option value="" disabled>เลือกหมวด</option>
              {Object.entries(CATEGORY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>
            ความสำคัญ
            <select value={f.priority} onChange={set("priority")}>
              {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>ชั้น / ห้อง / จุด (ไม่บังคับ)<input value={f.location} onChange={set("location")} maxLength={100} placeholder="เช่น ชั้น 2 ห้องบัญชี" /></label>
        </>
      )}
      <label>
        {staff ? "รายละเอียด (ไม่บังคับ ลูกค้าเห็น)" : complaint ? "เล่าสิ่งที่ไม่พอใจ — หัวหน้าทีมจะดูแลโดยตรง" : "บอกเราสั้น ๆ ว่าเกิดอะไรขึ้น"}
        <textarea
          value={f.desc}
          onChange={set("desc")}
          rows={4}
          maxLength={2000}
          required={!staff}
          placeholder={staff ? "อาการที่พบ เกิดตั้งแต่เมื่อไร" : complaint ? "เช่น ช่างมาช้ากว่านัด ไม่มีใครโทรแจ้ง" : "เช่น เครื่องพิมพ์ชั้น 2 พิมพ์ไม่ออก"}
        />
      </label>
      {!staff && !complaint && (
        <label className="check">
          <input type="checkbox" checked={f.urgent} onChange={set("urgent")} />
          ด่วน — ใช้งานไม่ได้เลย หรือกระทบหลายคน
        </label>
      )}
      {msg && <p role="alert" className="err">{msg}</p>}
      <div className="btns">
        <button type="submit" disabled={busy || (staff && !customers?.length)}>{busy ? "กำลังส่ง…" : staff ? "เปิดงาน" : "ส่งเรื่อง"}</button>
        <button type="button" className="ghost" onClick={onCancel}>ยกเลิก</button>
      </div>
    </form>
  );
}

function Detail({ id, user, nav, onBack, onLogout }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // เพิ่มค่านี้ทุกครั้งที่ทำรายการสำเร็จ เพื่อให้โหลดข้อมูลงานใหม่
  const [version, setVersion] = useState(0);
  useEffect(() => {
    fetch(`/api/tickets/${encodeURIComponent(id)}`)
      .then((r) => {
        if (r.status === 401) return onLogout();
        if (r.status === 404) return setErr("ไม่พบงานนี้");
        if (!r.ok) throw new Error(String(r.status));
        return r.json().then((j) => { setData(j); setErr(""); });
      })
      .catch(() => setErr("โหลดงานไม่สำเร็จ ลองใหม่อีกครั้ง"));
    // onLogout เปลี่ยนทุกครั้งที่ parent เรนเดอร์ จึงไม่ใส่ใน dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, version]);

  // ส่งคำสั่งไป server แล้วโหลดใหม่ ถ้าไม่สำเร็จแสดงสาเหตุจาก server
  async function act(path, body) {
    setMsg("");
    try {
      const r = await fetch(`/api/tickets/${encodeURIComponent(id)}/${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (r.status === 401) return onLogout();
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setMsg(ERR[d.error] ?? "ทำรายการไม่สำเร็จ");
        return false;
      }
      setVersion((v) => v + 1);
      return true;
    } catch {
      setMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
      return false;
    }
  }

  if (err) return <Shell nav={nav} onBack={onBack}><p role="alert" className="err">{err}</p></Shell>;
  if (!data) return <Shell nav={nav} onBack={onBack}><p className="hint">กำลังโหลด…</p></Shell>;
  const t = data.ticket;
  const { transitions, assign, worklog, internalComment, resolve, signoff, rate } = data.actions;
  const rep = data.report;

  return (
    <Shell nav={nav} onBack={onBack}>
      <section className="card">
        <div className="job-head">
          <h1>{t.subject}</h1>
          <span className={`prio ${t.priority}`}>{PRIORITY[t.priority]}</span>
        </div>
        <dl className="facts">
          <dt>เลขงาน</dt><dd>{t.id}</dd>
          <dt>ประเภทงาน</dt><dd>{TYPE[t.type]}</dd>
          <dt>ลูกค้า</dt><dd>{t.customer}</dd>
          <dt>สถานที่</dt><dd>{[t.site, t.location].filter(Boolean).join(" · ") || "-"}</dd>
          <dt>ประเภทปัญหา</dt><dd>{CATEGORY[t.category] ?? t.category}</dd>
          <dt>สถานะ</dt><dd>{STATUS[t.status]}</dd>
          <dt>ผู้รับผิดชอบ</dt><dd>{t.assignee ?? "ยังไม่มอบหมาย"}</dd>
          <dt>แจ้งเมื่อ</dt><dd>{when(t.created_at)}</dd>
        </dl>
        {msg && <p role="alert" className="err">{msg}</p>}
      </section>

      {(assign || transitions.length > 0 || worklog || resolve || signoff || rate) && (
        <section className="card">
          <h2>การกระทำ</h2>
          {assign && data.assignable.length > 0 && (
            <AssignForm assignable={data.assignable} onAssign={(assigneeId) => act("assign", { assigneeId })} />
          )}
          {transitions.length > 0 && (
            <TransitionForm transitions={transitions} onGo={(to, reason) => act("status", { to, reason })} />
          )}
          {resolve && (
            <ResolveForm onResolve={(f) => act("resolve", f)} />
          )}
          {signoff && (
            <SignOffForm
              defaultName={user.role === "customer" ? user.name : t.customer}
              onSign={(f) => act("signoff", f)}
            />
          )}
          {rate && (
            <RateForm onRate={(f) => act("rating", f)} />
          )}
          {worklog && (
            <TextForm
              label="บันทึกการทำงาน (ภายในทีม)"
              button="บันทึก work log"
              onSend={(text) => act("worklog", { text })}
            />
          )}
        </section>
      )}

      {rep && <ReportCard rep={rep} ticketId={t.id} />}

      <section className="card">
        <h2>ความคืบหน้า</h2>
        {data.history.length === 0 && <p className="hint">ยังไม่มีประวัติ</p>}
        {data.history.map((h, i) => (
          <div key={i} className="row">
            <b>{h.from_status ? `${STATUS[h.from_status]} → ` : ""}{STATUS[h.to_status]}</b>
            {h.reason && <p className="hint">{h.reason}</p>}
            <p className="hint">{h.by ?? "ระบบ"} · {when(h.at)}</p>
          </div>
        ))}
      </section>

      <section className="card">
        <h2>ความเห็น</h2>
        {data.comments.length === 0 && <p className="hint">ยังไม่มีความเห็น</p>}
        {data.comments.map((c, i) => (
          <div key={i} className="row">
            <p>{c.text}</p>
            <p className="hint">{c.by ?? "-"}{c.vis === "internal" ? " · ภายใน" : ""} · {when(c.at)}</p>
          </div>
        ))}
        <TextForm
          label="ตอบความเห็น"
          button="ส่งความเห็น"
          internal={internalComment}
          onSend={(text, vis) => act("comments", { text, vis })}
        />
      </section>

      {data.worklogs.length > 0 && (
        <section className="card">
          <h2>Work log <span className="hint">(ภายในทีม)</span></h2>
          {data.worklogs.map((w, i) => (
            <div key={i} className="row">
              <p>{w.text}</p>
              <p className="hint">
                {w.by ?? "-"} · {when(w.at)}{w.photos ? ` · รูป ${w.photos} รูป` : ""}
              </p>
            </div>
          ))}
        </section>
      )}
    </Shell>
  );
}

// ใบรายงานการปฏิบัติงาน: แสดงเมื่อมีใบรายงานแล้ว (รวมลายเซ็นและคะแนนถ้ามี)
function ReportCard({ rep, ticketId }) {
  return (
    <section className="card">
      <h2>ใบรายงาน <span className="hint">{rep.no}</span></h2>
      <a className="open-print" href={`/report/${encodeURIComponent(ticketId)}`} target="_blank" rel="noreferrer">เปิดใบรายงานเพื่อพิมพ์</a>
      <div className="row"><b>สรุปงานที่ทำ</b><p>{rep.summary}</p></div>
      {rep.parts && <div className="row"><b>อุปกรณ์ / อะไหล่</b><p>{rep.parts}</p></div>}
      <div className="row"><b>เวลาที่ใช้</b><p>{Number(rep.hours)} ชั่วโมง</p></div>
      {rep.sign_name && (
        <div className="row">
          <b>ผู้รับงาน</b>
          <p>{rep.sign_name}{rep.sign_position ? ` · ${rep.sign_position}` : ""} · {rep.sign_via === "app" ? "ลงนามผ่านแอป" : "ลงนามหน้างาน"}</p>
          <Image src={rep.signature} alt={`ลายเซ็นของ ${rep.sign_name}`} width={300} height={100} unoptimized className="signed" />
          <p className="hint">{when(rep.sign_at)}</p>
        </div>
      )}
      {rep.rating_score != null && (
        <div className="row">
          <b>คะแนนความพึงพอใจ</b>
          <p>{rep.rating_score} / 5{rep.rating_comment ? ` · ${rep.rating_comment}` : ""}</p>
        </div>
      )}
    </section>
  );
}

function ResolveForm({ onResolve }) {
  const [summary, setSummary] = useState("");
  const [parts, setParts] = useState("");
  const [hours, setHours] = useState("1");
  return (
    <div className="form">
      <label>
        สรุปงานที่ทำ (ลูกค้าจะเห็นในใบรายงาน)
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} maxLength={2000} />
      </label>
      <label>
        อุปกรณ์ / อะไหล่ที่ใช้ (ไม่บังคับ)
        <input value={parts} onChange={(e) => setParts(e.target.value)} maxLength={1000} />
      </label>
      <label>
        เวลาที่ใช้ (ชั่วโมง)
        <input type="number" min="0" max="999" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} />
      </label>
      <button disabled={!summary.trim()} onClick={() => onResolve({ summary: summary.trim(), parts: parts.trim(), hours: Number(hours) })}>
        ทำเสร็จ — ออกใบรายงาน
      </button>
    </div>
  );
}

function SignOffForm({ defaultName, onSign }) {
  const [name, setName] = useState(defaultName);
  const [position, setPosition] = useState("");
  const [sig, setSig] = useState("");
  return (
    <div className="form">
      <label>
        ชื่อผู้รับงาน
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
      </label>
      <label>
        ตำแหน่ง (ไม่บังคับ)
        <input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={100} />
      </label>
      <SignaturePad onChange={setSig} />
      <button disabled={!name.trim() || !sig} onClick={() => onSign({ name: name.trim(), position: position.trim(), signature: sig })}>
        ยืนยันการรับงาน
      </button>
    </div>
  );
}

// กรอบเซ็นชื่อด้วยนิ้วหรือเมาส์ คืนค่าเป็นรูป PNG (ว่างถ้ายังไม่ได้เซ็น)
function SignaturePad({ onChange }) {
  const ref = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const ink = useRef(false);

  const point = (e) => {
    const c = ref.current;
    const r = c.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) };
  };
  function down(e) {
    drawing.current = true;
    last.current = point(e);
    ref.current.setPointerCapture(e.pointerId);
  }
  function move(e) {
    if (!drawing.current) return;
    const ctx = ref.current.getContext("2d");
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.stroke();
    last.current = p;
    ink.current = true;
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(ink.current ? ref.current.toDataURL("image/png") : "");
  }
  function clear() {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    ink.current = false;
    onChange("");
  }
  return (
    <div className="pad">
      <canvas
        ref={ref}
        width={600}
        height={220}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        aria-label="กรอบเซ็นชื่อ"
      />
      <button type="button" className="ghost" onClick={clear}>ล้างลายเซ็น</button>
    </div>
  );
}

function RateForm({ onRate }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  return (
    <div className="form">
      <p className="hint">ให้คะแนนการให้บริการ</p>
      <div className="btns">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={n <= score ? "star on" : "star"} onClick={() => setScore(n)} aria-label={`${n} คะแนน`}>
            {n}
          </button>
        ))}
      </div>
      <label>
        ความคิดเห็น (ไม่บังคับ)
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} maxLength={500} />
      </label>
      <button disabled={score === 0} onClick={() => onRate({ score, comment: comment.trim() })}>ส่งคะแนน</button>
    </div>
  );
}

function AssignForm({ assignable, onAssign }) {
  const [who, setWho] = useState(assignable[0].id);
  return (
    <div className="form">
      <label>
        มอบหมายให้ช่าง
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          {assignable.map((x) => <option key={x.id} value={x.id}>{x.name}{x.team ? ` · ${x.team}` : ""}</option>)}
        </select>
      </label>
      <button onClick={() => onAssign(who)}>มอบหมาย</button>
    </div>
  );
}

function TransitionForm({ transitions, onGo }) {
  const [reason, setReason] = useState("");
  return (
    <div className="form">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="เหตุผล (ไม่บังคับ)"
        maxLength={500}
      />
      <div className="btns">
        {transitions.map((to) => (
          <button key={to} onClick={() => onGo(to, reason.trim() || null)}>{GO[to] ?? STATUS[to]}</button>
        ))}
      </div>
    </div>
  );
}

// กล่องข้อความทั่วไป: ใช้กับความเห็นและ work log
function TextForm({ label, button, internal, onSend }) {
  const [text, setText] = useState("");
  const [vis, setVis] = useState("public");
  return (
    <div className="form">
      <label>
        {label}
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={2000} />
      </label>
      {internal && (
        <select value={vis} onChange={(e) => setVis(e.target.value)}>
          <option value="public">ให้ลูกค้าเห็น</option>
          <option value="internal">ภายในทีมเท่านั้น</option>
        </select>
      )}
      <button
        disabled={!text.trim()}
        onClick={async () => {
          const ok = await onSend(text.trim(), vis);
          if (ok !== false) setText("");
        }}
      >
        {button}
      </button>
    </div>
  );
}

// เมนูหลักด้านบนของทุกหน้าที่เข้าสู่ระบบแล้ว (เฉพาะหน้าที่แอปนี้มีอยู่จริง)
function Nav({ user, active, onGo, onLogout }) {
  const link = (v, label) => (
    <button className={`navlink ${active === v ? "on" : ""}`} aria-current={active === v ? "page" : undefined} onClick={() => onGo(v)}>
      {label}
    </button>
  );
  return (
    <nav className="nav" aria-label="เมนูหลัก">
      {link("home", "งานของฉัน")}
      {user.role === "admin" && link("users", "จัดการบัญชี")}
      <span className="who">{user.name} · {ROLE[user.role]}</span>
      <button className="ghost" onClick={onLogout}>ออกจากระบบ</button>
    </nav>
  );
}

// กรอบของหน้ารายละเอียด: ปุ่มกลับไปรายการงาน
function Shell({ nav, onBack, children }) {
  return (
    <main className="home">
      {nav}
      <header className="top">
        <button className="ghost" onClick={onBack}>← กลับไปงานของคุณ</button>
      </header>
      {children}
    </main>
  );
}

// จัดการบัญชี (ผู้ดูแลระบบ): ดูทุกบัญชี เพิ่ม แก้ไข ตั้งรหัสใหม่ ปิดบัญชี — server ตรวจสิทธิ์ซ้ำทุกครั้ง
const BLANK = { name: "", email: "", role: "customer", team: "", customerId: "", newCompany: "", approver: false, removed: false, password: "" };

function Users({ nav, me, onLogout }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [edit, setEdit] = useState(null);   // ค่าในฟอร์มที่เปิดอยู่ (null = ไม่ได้เปิด)
  const [version, setVersion] = useState(0);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => {
        if (r.status === 401) return onLogout();
        if (!r.ok) throw new Error(String(r.status));
        return r.json().then(setData);
      })
      .catch(() => setErr("โหลดรายการบัญชีไม่สำเร็จ ลองใหม่อีกครั้ง"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const open = (u) => setEdit({ ...BLANK, ...u, team: u.team ?? "", customerId: u.customer_id ?? "", password: "" });

  return (
    <main className="home">
      {nav}
      <header className="top">
        <div>
          <p className="hint">เฉพาะผู้ดูแลระบบ</p>
          <h1>จัดการบัญชี</h1>
        </div>
        {!edit && <button className="ghost" onClick={() => setEdit(BLANK)}>+ เพิ่มบัญชี</button>}
      </header>

      {edit && data && (
        <UserForm
          key={edit.id ?? "new"}
          init={edit}
          customers={data.customers}
          self={edit.id === me.id}
          onLogout={onLogout}
          onClose={(saved) => { setEdit(null); if (saved) setVersion((v) => v + 1); }}
        />
      )}

      {err && <p role="alert" className="err">{err}</p>}
      {!err && !data && <p className="hint">กำลังโหลด…</p>}
      {data && ["customer", "team_leader", "technician", "admin"].map((role) => {
        const list = data.users.filter((u) => u.role === role);
        return (
          <section key={role} className="card">
            <h2>{ROLE[role]} <span className="hint">{list.length} คน</span></h2>
            {list.length === 0 && <p className="hint">ยังไม่มี</p>}
            {list.map((u) => (
              <button key={u.id} className="job" onClick={() => open(u)} aria-label={`แก้ไข ${u.name}`}>
                <div className="job-head">
                  <b>{u.name}{u.id === me.id ? " (คุณ)" : ""}</b>
                  {u.removed ? <span className="prio">ปิดบัญชี</span> : u.approver && <span className="prio">ตัวแทนบริษัท</span>}
                </div>
                <p className="hint">{[u.email, u.customer, u.team && `ทีม ${u.team}`].filter(Boolean).join(" · ")}</p>
              </button>
            ))}
          </section>
        );
      })}
    </main>
  );
}

function UserForm({ init, customers, self, onLogout, onClose }) {
  const [f, setF] = useState(init);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  // ยังไม่มีบริษัทเลย = ต้องกรอกบริษัทใหม่
  const company = f.customerId || customers[0]?.id || "new";

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch(f.id ? `/api/users/${encodeURIComponent(f.id)}` : "/api/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.name, email: f.email, role: f.role, team: f.team, approver: f.approver, removed: f.removed, password: f.password,
          customerId: company === "new" ? "" : company,
          newCompany: company === "new" ? f.newCompany : "",
        }),
      });
      if (r.status === 401) return onLogout();
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        return setMsg(ERR[d.error] ?? "บันทึกไม่สำเร็จ");
      }
      onClose(true);
    } catch {
      setMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={save}>
      <h2>{f.id ? `แก้ไขบัญชี ${init.name}` : "เพิ่มบัญชี"}</h2>
      <label>ชื่อ-นามสกุล<input value={f.name} onChange={set("name")} maxLength={100} required /></label>
      <label>อีเมล (ใช้เข้าสู่ระบบ)<input type="email" value={f.email} onChange={set("email")} maxLength={100} autoComplete="off" required /></label>
      <label>
        บทบาท
        <select value={f.role} onChange={set("role")} disabled={self}>
          {Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      {f.role === "customer" && (
        <>
          <label>
            บริษัท
            <select value={company} onChange={set("customerId")}>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="new">+ บริษัทใหม่</option>
            </select>
          </label>
          {company === "new" && (
            <label>ชื่อบริษัทใหม่<input value={f.newCompany} onChange={set("newCompany")} maxLength={100} required /></label>
          )}
          <label className="check">
            <input type="checkbox" checked={f.approver} onChange={set("approver")} />
            ตัวแทนบริษัท (หัวหน้าฝั่งลูกค้า อนุมัติพนักงานของบริษัทได้)
          </label>
        </>
      )}
      {(f.role === "technician" || f.role === "team_leader") && (
        <label>ทีม (เช่น T1 — หัวหน้าทีมมอบหมายงานได้เฉพาะช่างทีมเดียวกัน)<input value={f.team} onChange={set("team")} maxLength={20} /></label>
      )}
      <label>
        {f.id ? "ตั้งรหัสผ่านใหม่ (เว้นว่าง = ใช้รหัสเดิม)" : "รหัสผ่านเริ่มต้น (อย่างน้อย 8 ตัว แจ้งเจ้าของบัญชีเอง)"}
        <input type="password" value={f.password} onChange={set("password")} minLength={8} maxLength={200} autoComplete="new-password" required={!f.id} />
      </label>
      {f.id && !self && (
        <label className="check">
          <input type="checkbox" checked={f.removed} onChange={set("removed")} />
          ปิดบัญชี (เข้าระบบไม่ได้ ประวัติงานยังอยู่ครบ)
        </label>
      )}
      {msg && <p role="alert" className="err">{msg}</p>}
      <div className="btns">
        <button type="submit" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึก"}</button>
        <button type="button" className="ghost" onClick={() => onClose(false)}>ยกเลิก</button>
      </div>
    </form>
  );
}
