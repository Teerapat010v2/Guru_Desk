"use client";

import { useEffect, useRef, useState } from "react";

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
  invalid_name: "กรุณากรอกชื่อผู้ลงนาม",
  invalid_signature: "กรุณาเซ็นชื่อในกรอบก่อน",
  invalid_score: "กรุณาเลือกคะแนน 1–5",
  already_rated: "งานนี้ให้คะแนนไปแล้ว",
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
const when = (s) => new Date(s).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });

export default function Page() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [openId, setOpenId] = useState(null);

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
  const logout = () => { setUser(null); setOpenId(null); };
  return openId
    ? <Detail id={openId} user={user} onBack={() => setOpenId(null)} onLogout={logout} />
    : <Home user={user} onOpen={setOpenId} onLogout={logout} />;
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
        <img src="/logo.png" alt="Guru IT Solution" width={96} height={28} />
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

function Home({ user, onOpen, onLogout }) {
  const [tickets, setTickets] = useState(null);
  const [err, setErr] = useState("");

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

  async function logout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    onLogout();
  }

  return (
    <main className="home">
      <Nav user={user} active="home" onLogout={logout} />
      <header className="top">
        <div>
          <p className="hint">{ROLE[user.role]}</p>
          <h1>สวัสดี คุณ{user.name}</h1>
        </div>
      </header>

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
            <p className="hint">{t.id} · {t.customer}</p>
            <p className="hint">{STATUS[t.status]}{t.assignee ? ` · ช่าง${t.assignee}` : " · ยังไม่มอบหมาย"}</p>
          </button>
        ))}
      </section>
    </main>
  );
}

function Detail({ id, user, onBack, onLogout }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // โหลดข้อมูลงานใหม่ (หลังทำรายการทุกครั้ง)
  async function load() {
    try {
      const r = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
      if (r.status === 401) return onLogout();
      if (r.status === 404) return setErr("ไม่พบงานนี้");
      if (!r.ok) throw new Error(String(r.status));
      setData(await r.json());
      setErr("");
    } catch {
      setErr("โหลดงานไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

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
      await load();
      return true;
    } catch {
      setMsg("ติดต่อเซิร์ฟเวอร์ไม่ได้");
      return false;
    }
  }

  if (err) return <Shell user={user} onLogout={onLogout} onBack={onBack}><p role="alert" className="err">{err}</p></Shell>;
  if (!data) return <Shell user={user} onLogout={onLogout} onBack={onBack}><p className="hint">กำลังโหลด…</p></Shell>;
  const t = data.ticket;
  const { transitions, assign, worklog, internalComment, resolve, signoff, rate } = data.actions;
  const rep = data.report;

  return (
    <Shell user={user} onLogout={onLogout} onBack={onBack}>
      <section className="card">
        <div className="job-head">
          <h1>{t.subject}</h1>
          <span className={`prio ${t.priority}`}>{PRIORITY[t.priority]}</span>
        </div>
        <dl className="facts">
          <dt>เลขงาน</dt><dd>{t.id}</dd>
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
          <img src={rep.signature} alt={`ลายเซ็นของ ${rep.sign_name}`} className="signed" />
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
function Nav({ user, active, onLogout }) {
  return (
    <nav className="nav" aria-label="เมนูหลัก">
      <a className={`navlink ${active === "home" ? "on" : ""}`} href="/" aria-current={active === "home" ? "page" : undefined}>งานของฉัน</a>
      <span className="who">{user.name} · {ROLE[user.role]}</span>
      <button className="ghost" onClick={onLogout}>ออกจากระบบ</button>
    </nav>
  );
}

// กรอบของหน้ารายละเอียด: ปุ่มกลับไปรายการงาน
function Shell({ user, onLogout, onBack, children }) {
  return (
    <main className="home">
      <Nav user={user} active="home" onLogout={onLogout} />
      <header className="top">
        <button className="ghost" onClick={onBack}>← กลับไปงานของคุณ</button>
      </header>
      {children}
    </main>
  );
}
