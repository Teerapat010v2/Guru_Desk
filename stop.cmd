@echo off
rem Stops the backend (4000) and web (3000).
powershell -NoProfile -Command "foreach($p in 3000,4000){ Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }"
echo Stopped.
