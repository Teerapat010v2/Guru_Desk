# สร้างบัญชีผู้ใช้แบบถามทีละข้อ (สะดวกกว่าใส่ตัวแปรเอง) — ห่อ scripts/create-user.js
# รหัสผ่านถามแบบไม่แสดงตัวอักษรบนจอ และไม่ติดในประวัติคำสั่ง
$backend = Split-Path -Parent $PSScriptRoot
$env:NAME = Read-Host 'ชื่อ-นามสกุล'
$env:EMAIL = Read-Host 'อีเมล (ใช้เข้าสู่ระบบ)'
$role = Read-Host 'บทบาท [admin / team_leader / technician / customer] (กด Enter = admin)'
$env:ROLE = if ($role) { $role.Trim() } else { 'admin' }
if ($env:ROLE -in 'technician', 'team_leader') { $env:TEAM = Read-Host 'ทีม (เช่น T1 ว่างได้)' }
if ($env:ROLE -eq 'customer') { $env:CUSTOMER_ID = Read-Host 'รหัสบริษัทลูกค้า (เช่น C1)' }
$sec = Read-Host 'รหัสผ่าน (อย่างน้อย 8 ตัว)' -AsSecureString
$env:PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec))
Push-Location $backend
node --env-file=.env scripts/create-user.js
Pop-Location
foreach ($k in 'NAME', 'EMAIL', 'ROLE', 'TEAM', 'CUSTOMER_ID', 'PASSWORD') { Remove-Item "Env:$k" -ErrorAction SilentlyContinue }
