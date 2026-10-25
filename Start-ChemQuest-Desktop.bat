@echo off
chcp 65001 >nul
title ChemQuest ม.4 - เกมตะลุยด่านห้องแล็บการคำนวณทางเคมี (Electron Desktop)
set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"
cd /d "%~dp0"

echo ========================================================
echo   กำลังเปิดแอปพลิเคชัน ChemQuest ม.4 (Electron + SQLite)
echo ========================================================

if not exist "dist\index.html" (
    echo [1/2] กำลังสร้างไฟล์ Frontend ด้วย Vite...
    "%LOCALAPPDATA%\Programs\nodejs\node.exe" ".\node_modules\vite\bin\vite.js" build
)

echo [2/2] กำลังเปิดหน้าต่างเกม Desktop ด้วย Electron...
start "" ".\node_modules\electron\dist\electron.exe" .
