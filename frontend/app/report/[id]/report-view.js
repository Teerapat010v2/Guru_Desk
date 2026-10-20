"use client";
import Image from "next/image";
import Link from "next/link";

import { useEffect, useState } from "react";

const CATEGORY = {
  printer: "เครื่องพิมพ์", network: "อินเทอร์เน็ต/เครือข่าย", account: "บัญชี/รหัสผ่าน",
  install: "ติดตั้งเครื่อง", repair: "ซ่อมอุปกรณ์", cctv: "กล้องวงจรปิด", other: "อื่น ๆ",
};
const when = (s) => new Date(s).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });

// หน้าพิมพ์ใบรายงาน: ใช้ข้อมูลเดียวกับหน้ารายละเอียด (สิทธิ์ตรวจที่ server)
export default function ReportView({ id }) {
  const [d, setD] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/tickets/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setD)
      .catch(() => setErr("เปิดใบรายงานไม่ได้ (ต้องเข้าสู่ระบบและมีสิทธิ์ดูงานนี้)"));
  }, [id]);

  if (err) return <main className="report"><p className="err">{err}</p></main>;
  if (!d) return <main className="report"><p>กำลังโหลด…</p></main>;
  const t = d.ticket;
  const r = d.report;
  if (!r) return <main className="report"><p>งาน {t.id} ยังไม่มีใบรายงาน</p></main>;

  return (
    <main className="report">
      <div className="no-print actions">
        <button onClick={() => window.print()}>พิมพ์ / บันทึกเป็น PDF</button>
        <Link className="navlink" href="/">← กลับไปงานของฉัน</Link>
      </div>
      <header className="rhead">
        <Image src="/logo.png" width={120} height={34} alt="Guru IT Solution" unoptimized />
        <div>
          <h1>ใบรายงานการปฏิบัติงาน</h1>
          <p>เลขที่ {r.no}</p>
        </div>
      </header>

      <dl className="facts">
        <dt>เลขงาน</dt><dd>{t.id}</dd>
        <dt>ลูกค้า</dt><dd>{t.customer}</dd>
        <dt>สถานที่</dt><dd>{[t.site, t.location].filter(Boolean).join(" · ") || "-"}</dd>
        <dt>ปัญหา</dt><dd>{t.subject}</dd>
        <dt>ประเภท</dt><dd>{CATEGORY[t.category] ?? t.category}</dd>
        <dt>ช่างผู้ปฏิบัติงาน</dt><dd>{t.assignee ?? "-"}</dd>
        <dt>วันที่ออกรายงาน</dt><dd>{when(r.at)}</dd>
        <dt>เวลาที่ใช้</dt><dd>{Number(r.hours)} ชั่วโมง</dd>
      </dl>

      <h2>สรุปงานที่ทำ</h2>
      <p className="pre">{r.summary}</p>
      {r.parts && (<><h2>อุปกรณ์ / อะไหล่ที่ใช้</h2><p className="pre">{r.parts}</p></>)}

      <h2>การรับงาน</h2>
      {r.sign_name ? (
        <div className="sign">
          <Image src={r.signature} alt={`ลายเซ็นของ ${r.sign_name}`} width={260} height={90} unoptimized />
          <p>{r.sign_name}{r.sign_position ? ` · ${r.sign_position}` : ""}</p>
          <p className="muted">{r.sign_via === "app" ? "ลงนามผ่านแอป" : "ลงนามหน้างาน"} · {when(r.sign_at)}</p>
        </div>
      ) : (
        <p className="muted">ยังไม่มีการลงนามรับงาน</p>
      )}

      {r.rating_score != null && (
        <p className="muted">คะแนนความพึงพอใจ {r.rating_score} / 5{r.rating_comment ? ` · ${r.rating_comment}` : ""}</p>
      )}
      <p className="foot">เอกสารนี้สร้างจากระบบ Guru IT Service Desk</p>
    </main>
  );
}
