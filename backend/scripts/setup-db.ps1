# ตั้งค่าฐานข้อมูลหลักให้แอป (PostgreSQL 18 พอร์ต 5434) — รันเองครั้งเดียว รันซ้ำได้
# ถามรหัสผ่านของผู้ใช้ postgres (ที่ตั้งตอนติดตั้ง) แล้ว: สร้างฐานข้อมูล guru_desk, โหลด schema,
# สร้างผู้ใช้ guru_app สิทธิ์จำกัดสำหรับแอป และเขียน backend/.env ให้แอปใช้ guru_app
# รหัสผ่าน postgres ไม่ถูกบันทึกที่ไหน ใช้แค่ระหว่างรันสคริปต์นี้
param(
  [int]$Port = 5434,
  [string]$Psql = 'C:\Program Files\PostgreSQL\18\bin\psql.exe',
  [string]$EnvFile = (Join-Path (Split-Path -Parent $PSScriptRoot) '.env')
)
$schema = Join-Path (Split-Path -Parent $PSScriptRoot) 'db\schema.sql'

function Fail($msg) {
  Write-Host "ไม่สำเร็จ: $msg" -ForegroundColor Red
  $env:PGPASSWORD = $null
  exit 1
}
# รันคำสั่ง SQL ด้วยผู้ใช้ postgres แล้วคืนผลลัพธ์ (หยุดทันทีถ้าผิดพลาด)
function Q($db, $sql) {
  $out = & $Psql -h localhost -p $Port -U postgres -d $db -v ON_ERROR_STOP=1 -tAc $sql 2>&1
  if ($LASTEXITCODE -ne 0) { Fail ($out | Out-String) }
  return ($out | Out-String).Trim()
}

if (-not (Test-Path $Psql)) { Fail "ไม่พบ $Psql" }
if (-not (Test-Path $schema)) { Fail "ไม่พบ $schema" }

# ถ้าตั้ง PGPASSWORD ไว้แล้ว (รันแบบอัตโนมัติ) ใช้ค่านั้น ไม่งั้นถามแบบไม่แสดงตัวอักษรบนจอ
if (-not $env:PGPASSWORD) {
  $sec = Read-Host 'รหัสผ่านของผู้ใช้ postgres (ที่ตั้งตอนติดตั้ง PostgreSQL)' -AsSecureString
  $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
}
$env:PGCLIENTENCODING = 'UTF8'

& $Psql -h localhost -p $Port -U postgres -d postgres -tAc 'select 1' *> $null
if ($LASTEXITCODE -ne 0) { Fail "ต่อเซิร์ฟเวอร์พอร์ต $Port ไม่ได้ — รหัสผ่านผิด หรือบริการ PostgreSQL ไม่ทำงาน" }

if ((Q 'postgres' "select count(*) from pg_database where datname = 'guru_desk'") -eq '0') {
  Q 'postgres' "create database guru_desk encoding 'UTF8' template template0" | Out-Null
  Write-Host 'สร้างฐานข้อมูล guru_desk แล้ว'
} else {
  Write-Host 'มีฐานข้อมูล guru_desk อยู่แล้ว'
}

if ((Q 'guru_desk' "select count(*) from information_schema.tables where table_schema = 'public' and table_name = 'users'") -eq '0') {
  $out = & $Psql -h localhost -p $Port -U postgres -d guru_desk -v ON_ERROR_STOP=1 -q -f $schema 2>&1
  if ($LASTEXITCODE -ne 0) { Fail "โหลด schema ไม่ได้: $($out | Out-String)" }
  Write-Host 'โหลดโครงสร้างตารางแล้ว'
} else {
  Write-Host 'มีตารางอยู่แล้ว ไม่โหลด schema ซ้ำ (ข้อมูลเดิมไม่ถูกแตะ)'
}

# ผู้ใช้ของแอป: อ่าน/เขียนข้อมูลได้ แต่สร้างหรือลบตารางไม่ได้ · รหัสสุ่มใหม่ทุกครั้งที่รัน (มีแค่ใน .env)
$chars = [char[]]'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$appPw = -join ($bytes | ForEach-Object { $chars[$_ % $chars.Length] })
if ((Q 'postgres' "select count(*) from pg_roles where rolname = 'guru_app'") -eq '0') {
  Q 'postgres' "create role guru_app login password '$appPw'" | Out-Null
} else {
  Q 'postgres' "alter role guru_app with login password '$appPw'" | Out-Null
}
Q 'guru_desk' @"
grant connect on database guru_desk to guru_app;
grant usage on schema public to guru_app;
grant select, insert, update, delete on all tables in schema public to guru_app;
grant usage, select on all sequences in schema public to guru_app;
alter default privileges in schema public grant select, insert, update, delete on tables to guru_app;
alter default privileges in schema public grant usage, select on sequences to guru_app;
"@ | Out-Null

[IO.File]::WriteAllText($EnvFile, "DATABASE_URL=postgres://guru_app:$appPw@localhost:$Port/guru_desk`n")
$tables = Q 'guru_desk' "select count(*) from information_schema.tables where table_schema = 'public'"
$env:PGPASSWORD = $null

Write-Host "เสร็จแล้ว: ฐานข้อมูล guru_desk มี $tables ตาราง และแอปใช้ผู้ใช้ guru_app (สิทธิ์จำกัด)" -ForegroundColor Green
Write-Host "ขั้นต่อไป: สร้างผู้ดูแลระบบคนแรกด้วย scripts/create-user.js"
