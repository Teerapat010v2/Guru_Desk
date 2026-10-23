# Guru IT: เปิดร่างอีเมลใน Outlook คลาสสิกทันที — ใส่ลายเซ็นเริ่มต้นของ Outlook และแนบ PDF จากโฟลเดอร์ Downloads
# เรียกจากลิงก์ guru-outlook://compose?to=..&subject=..&body=..&file=ชื่อไฟล์.pdf (ตัวติดตั้งลงทะเบียนลิงก์นี้ให้ — ดูปุ่ม "ติดตั้งตัวช่วย Outlook" ในเว็บ)
# ทดสอบโดยไม่เปิด Outlook: powershell -File outlook.ps1 "guru-outlook://compose?..." -DryRun
param([Parameter(Position = 0)][string]$Link, [switch]$DryRun)
Add-Type -AssemblyName System.Web
Add-Type -AssemblyName System.Windows.Forms
function Fail($m) { [System.Windows.Forms.MessageBox]::Show($m, 'Guru IT') | Out-Null; exit 1 }

# ข้อมูลจากลิงก์ไม่น่าเชื่อถือ: ตรวจรูปแบบก่อนใช้ — สร้างได้แค่ "ร่าง" ไม่ส่งเอง และแนบได้เฉพาะ .pdf ในโฟลเดอร์ Downloads
$q = [System.Web.HttpUtility]::ParseQueryString(([Uri]$Link).Query)
$to = $q['to']; $subject = $q['subject']; $body = $q['body']; $file = $q['file']
if ($to -notmatch '^[^\s@,;]+@[^\s@,;]+(,[^\s@,;]+@[^\s@,;]+)*$') { Fail 'ผู้รับอีเมลไม่ถูกต้อง' }
if ($file -and $file -notmatch '^[A-Za-z0-9._-]{1,80}\.pdf$') { Fail 'ชื่อไฟล์แนบไม่ถูกต้อง' }

$path = $null
if ($file) {
  $path = Join-Path (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path $file
  # เบราว์เซอร์อาจยังดาวน์โหลดไม่เสร็จ: รอไฟล์ปรากฏและเปิดอ่านได้ (สูงสุด 20 วินาที)
  for ($i = 0; $i -lt 40; $i++) {
    if (Test-Path $path) { try { [IO.File]::Open($path, 'Open', 'Read', 'None').Close(); break } catch { } }
    Start-Sleep -Milliseconds 500
  }
  if (-not (Test-Path $path)) { Fail "ไม่พบไฟล์ $file ในโฟลเดอร์ Downloads" }
}
if ($DryRun) { "to=$to"; "subject=$subject"; "file=$path"; "body=$body"; exit 0 }

try { $ol = New-Object -ComObject Outlook.Application } catch { Fail 'ไม่พบ Outlook คลาสสิกในเครื่องนี้ (ตัวช่วยนี้ใช้กับ Outlook แบบ Desktop เท่านั้น)' }
$m = $ol.CreateItem(0)
$m.To = $to.Replace(',', ';')
$m.Subject = $subject
if ($path) { $m.Attachments.Add($path) | Out-Null }
$m.Display()   # เปิดหน้าต่างก่อน เพื่อให้ Outlook ใส่ลายเซ็นเริ่มต้นของบัญชีนี้ลงในเนื้อความ แล้วค่อยเติมข้อความไว้ก่อนลายเซ็น
$html = '<div style="font-family:Calibri,sans-serif;font-size:11pt">' + ([System.Net.WebUtility]::HtmlEncode($body) -replace "`r?`n", '<br>') + '</div>'
$cur = $m.HTMLBody
$b = $cur.IndexOf('<body')
$at = if ($b -ge 0) { $cur.IndexOf('>', $b) + 1 } else { 0 }
$m.HTMLBody = $cur.Insert($at, $html)
