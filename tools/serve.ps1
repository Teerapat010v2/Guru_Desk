# เปิดเว็บ Guru IT Service Desk บนเครื่องนี้ (ไม่ต้องติดตั้ง Node/Python)
# วิธีใช้:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1   แล้วเปิด http://localhost:8765
param([string]$Root = "guru-service-desk", [int]$Port = 8765)
$Root = (Resolve-Path $Root).Path
$types = @{ '.html' = 'text/html; charset=utf-8'; '.css' = 'text/css'; '.js' = 'text/javascript'; '.png' = 'image/png'; '.webmanifest' = 'application/manifest+json' }
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
Write-Output "listening http://localhost:$Port"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
  if ($rel.EndsWith('/')) { $rel += 'index.html' }
  $p = [IO.Path]::GetFullPath((Join-Path $Root $rel.TrimStart('/')))
  $res = $ctx.Response
  if ($p.StartsWith($Root) -and (Test-Path $p -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($p)
    $ext = [IO.Path]::GetExtension($p)
    $res.ContentType = if ($types[$ext]) { $types[$ext] } else { 'application/octet-stream' }
    $res.Headers.Add('Cache-Control', 'no-store')
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else { $res.StatusCode = 404 }
  $res.Close()
}
