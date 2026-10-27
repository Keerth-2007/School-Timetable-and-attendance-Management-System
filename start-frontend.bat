@echo off
title School Timetable and Attendance - React Frontend (Port 8081)
cd /d "%~dp0school-frontend"
echo ========================================================
echo Starting School System React Frontend on Port 8081
echo ========================================================
if not exist "node_modules" (
    echo Installing node dependencies...
    call npm install
)
call npm run dev
pause
