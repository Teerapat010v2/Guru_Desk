@echo off
rem Guru IT: installs the Outlook helper (once per PC, no admin rights: writes only HKCU and the user's own folder).
rem Uninstall: reg delete "HKCU\Software\Classes\guru-outlook" /f   and delete the folder %LOCALAPPDATA%\GuruITSM
set "D=%LOCALAPPDATA%\GuruITSM"
mkdir "%D%" 2>nul
set "B="
__CHUNKS__
powershell -NoProfile -ExecutionPolicy Bypass -Command "[IO.File]::WriteAllBytes('%D%\outlook.ps1', [Convert]::FromBase64String($env:B))"
reg add "HKCU\Software\Classes\guru-outlook" /ve /d "URL:Guru Outlook" /f >nul
reg add "HKCU\Software\Classes\guru-outlook" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\Software\Classes\guru-outlook\shell\open\command" /ve /d "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%D%\outlook.ps1\" \"%%1\"" /f >nul
echo Guru Outlook helper installed. Go back to the web page and click Send confirmation email again.
pause
