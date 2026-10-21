# สำรองฐานข้อมูลแอปเป็นไฟล์ .sql ในโฟลเดอร์ guru-service-desk\backups (ใช้ DATABASE_URL ใน backend\.env — ไม่ต้องพิมพ์รหัส)
# รันเอง: powershell -ExecutionPolicy Bypass -File backend\scripts\backup-db.ps1   · เก็บล่าสุด 14 ไฟล์
$backend = Split-Path -Parent $PSScriptRoot
$pgDump = 'C:\Program Files\PostgreSQL\18\bin\pg_dump.exe'
$line = Get-Content (Join-Path $backend '.env') | Where-Object { $_ -like 'DATABASE_URL=*' } | Select-Object -First 1
if (-not $line) { Write-Host 'ไม่พบ DATABASE_URL ใน backend\.env' -ForegroundColor Red; exit 1 }
$url = $line.Substring('DATABASE_URL='.Length)
$dir = Join-Path $backend '..\backups'
New-Item -ItemType Directory -Force $dir | Out-Null
$file = Join-Path (Resolve-Path $dir) ('guru_desk-{0}.sql' -f (Get-Date -Format 'yyyyMMdd-HHmm'))
& $pgDump --dbname=$url --no-owner --file=$file
if ($LASTEXITCODE -ne 0) { Write-Host 'สำรองไม่สำเร็จ' -ForegroundColor Red; exit 1 }
Get-ChildItem $dir -Filter 'guru_desk-*.sql' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item
Write-Host "สำรองแล้ว: $file" -ForegroundColor Green
