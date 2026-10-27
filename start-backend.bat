@echo off
title School Timetable and Attendance - Spring Boot Backend (Port 8080)
cd /d "%~dp0school-system"
echo ========================================================
echo Starting School System Spring Boot Backend on Port 8080
echo ========================================================
if exist "mvnw.cmd" (
    call mvnw.cmd spring-boot:run
) else (
    call mvn spring-boot:run
)
pause
