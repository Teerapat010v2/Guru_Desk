@echo off
rem One-click start: backend (4000) + web (3000), then opens the browser.
rem Needs: PostgreSQL service running, backend\.env filled in. Run stop.cmd to stop.
cd /d "%~dp0"

if not exist backend\.env (
  echo backend\.env not found - copy backend\.env.example and fill it in first.
  pause & exit /b 1
)

rem Free the ports if an older copy is still running.
powershell -NoProfile -Command "foreach($p in 3000,4000){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }"

if not exist frontend\node_modules ( echo Installing web packages... & pushd frontend & call npm install & popd )
if not exist backend\node_modules ( echo Installing backend packages... & pushd backend & call npm install & popd )
if not exist frontend\.next\BUILD_ID ( echo Building web, first run only... & pushd frontend & call npx next build & popd )

start "Guru backend" /min /d backend cmd /c "node --env-file=.env server.js"
start "Guru web" /min /d frontend cmd /c "npx next start -p 3000"

echo Waiting for the system...
powershell -NoProfile -Command "$ok=$false; 1..40 | ForEach-Object { if(-not $ok){ try { Invoke-WebRequest http://localhost:3000/ -UseBasicParsing -TimeoutSec 2 | Out-Null; Invoke-WebRequest http://localhost:4000/api/rev -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop | Out-Null; $ok=$true } catch { if($_.Exception.Response -and $_.Exception.Response.StatusCode.value__ -eq 401){ $ok=$true } else { Start-Sleep 1 } } } }; if(-not $ok){ exit 1 }"
if errorlevel 1 ( echo Did not start in time - check the two minimized windows for errors. & pause & exit /b 1 )

echo Ready: http://localhost:3000
start "" http://localhost:3000
