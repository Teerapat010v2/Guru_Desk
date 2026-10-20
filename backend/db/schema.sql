-- Guru IT Service Desk — โครงสร้างฐานข้อมูล PostgreSQL (ใช้จริง)
-- ทดสอบแล้วกับ PostgreSQL 17 (ฐานข้อมูล guru_desk)
-- ตารางตรงกับข้อมูลในแอป: users/customers/sites/tickets/... เพิ่ม sessions, password_hash และ report_seq ตามที่ backend ใช้

CREATE TABLE customers (
  id        text PRIMARY KEY,               -- C1, C2 ...
  name      text NOT NULL,
  contract  text CHECK (contract IN ('ma','oncall','project')),
  contact   text, phone text, email text
);

CREATE TABLE sites (
  id          text PRIMARY KEY,             -- S1, S2 ...
  customer_id text NOT NULL REFERENCES customers(id),
  name        text NOT NULL,
  address     text NOT NULL,
  contact     text, phone text,
  lat         double precision, lng double precision
);

CREATE TABLE users (
  id          text PRIMARY KEY,             -- u1, tech1, m1 ...
  name        text NOT NULL,
  role        text NOT NULL CHECK (role IN ('customer','technician','team_leader','admin')),
  email       text UNIQUE,                  -- ใช้เข้าสู่ระบบ (เก็บตัวพิมพ์เล็ก)
  password_hash text,                       -- scrypt$salt$key (ตั้งด้วย scripts/set-password.js)
  phone       text,
  team        text,
  customer_id text REFERENCES customers(id),
  site_id     text REFERENCES sites(id),
  approver    boolean NOT NULL DEFAULT false,
  skills      text[] NOT NULL DEFAULT '{}',
  removed     boolean NOT NULL DEFAULT false  -- ลบ = ปิดบัญชี เก็บประวัติไว้
);

-- session ของผู้ใช้ที่เข้าสู่ระบบ: เก็บแฮชของโทเคน ไม่เก็บโทเคนจริง
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE tickets (
  id          text PRIMARY KEY,             -- T-1001 ...
  type        text NOT NULL DEFAULT 'service' CHECK (type IN ('service','complaint')),
  customer_id text NOT NULL REFERENCES customers(id),
  site_id     text REFERENCES sites(id),
  location    text,
  subject     text NOT NULL,
  category    text NOT NULL,
  priority    text NOT NULL CHECK (priority IN ('urgent','high','medium','low')),
  status      text NOT NULL CHECK (status IN ('new','assigned','in_progress','pending','resolved','closed')),
  assignee_id text REFERENCES users(id),
  version     integer NOT NULL DEFAULT 1,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_history (
  id          bigserial PRIMARY KEY,
  ticket_id   text NOT NULL REFERENCES tickets(id),
  from_status text, to_status text NOT NULL,
  by_user     text NOT NULL,
  reason      text,
  at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id        bigserial PRIMARY KEY,
  ticket_id text NOT NULL REFERENCES tickets(id),
  by_user   text NOT NULL,
  vis       text NOT NULL CHECK (vis IN ('public','internal')),
  text      text NOT NULL,
  at        timestamptz NOT NULL DEFAULT now()
);

-- Work log = หลักฐานการทำงาน (ภายในเท่านั้น) — ห้ามแก้ไข/ลบหลังบันทึก
CREATE TABLE worklogs (
  id          bigserial PRIMARY KEY,
  ticket_id   text NOT NULL REFERENCES tickets(id),
  by_user     text NOT NULL,
  text        text NOT NULL DEFAULT '',
  photo_ids   text[] NOT NULL DEFAULT '{}',
  at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE photos (
  id      text PRIMARY KEY,                 -- P1 ...
  data    text NOT NULL                     -- dataURL (JPEG ย่อแล้ว) — ย้ายไป object storage เมื่อขนาดโตขึ้น
);

-- เลขที่ใบรายงาน SR-ปี-ลำดับ (ลำดับไม่รีเซ็ตรายปี)
CREATE SEQUENCE IF NOT EXISTS report_seq;

CREATE TABLE reports (
  ticket_id text PRIMARY KEY REFERENCES tickets(id),
  no        text NOT NULL UNIQUE,           -- SR-2026-0001
  summary   text NOT NULL,
  parts     text NOT NULL DEFAULT '',
  hours     numeric(6,2) NOT NULL DEFAULT 0,
  by_user   text NOT NULL,
  at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE signoffs (
  ticket_id text PRIMARY KEY REFERENCES reports(ticket_id),
  name      text NOT NULL, position text,
  via       text NOT NULL CHECK (via IN ('app','onsite')),
  by_user   text NOT NULL,
  signature text NOT NULL,                  -- dataURL ลายเซ็น
  at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
  ticket_id text PRIMARY KEY REFERENCES tickets(id),
  score     integer NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment   text NOT NULL DEFAULT '',
  by_user   text NOT NULL,
  via       text,
  at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE projects (
  id          text PRIMARY KEY,             -- PJ1 ...
  name        text NOT NULL,
  category    text NOT NULL,
  customer_id text NOT NULL REFERENCES customers(id),
  site_id     text REFERENCES sites(id),
  owner_id    text REFERENCES users(id),
  due         date,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_tasks (
  id         bigserial PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id),
  position   integer NOT NULL,
  text       text NOT NULL,
  done       boolean NOT NULL DEFAULT false
);

CREATE TABLE notifications (
  id        text PRIMARY KEY,
  to_user   text NOT NULL REFERENCES users(id),
  title     text NOT NULL, body text NOT NULL,
  ticket_id text REFERENCES tickets(id),
  go        text,
  read      boolean NOT NULL DEFAULT false,
  at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE join_requests (
  id          text PRIMARY KEY,             -- J1 ...
  customer_id text NOT NULL REFERENCES customers(id),
  site_id     text REFERENCES sites(id),
  name        text NOT NULL, email text NOT NULL, phone text NOT NULL,
  photo_id    text REFERENCES photos(id),
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by  text REFERENCES users(id),
  at          timestamptz NOT NULL DEFAULT now(),
  decided_at  timestamptz
);

-- บันทึกตรวจสอบ: เพิ่มได้อย่างเดียว (ไม่มี UPDATE/DELETE จากแอป)
CREATE TABLE audit_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  actor_name text NOT NULL, role text,
  action     text NOT NULL, detail text
);

-- ดัชนีสำหรับหน้าที่ใช้บ่อย
CREATE INDEX tickets_customer_idx ON tickets(customer_id);
CREATE INDEX tickets_assignee_idx ON tickets(assignee_id);
CREATE INDEX tickets_status_idx   ON tickets(status);
CREATE INDEX worklogs_ticket_idx  ON worklogs(ticket_id);
CREATE INDEX notifications_to_idx ON notifications(to_user, read);
