@echo off
title AI Learning Adventure - Local Mobile Simulator
cls
echo ========================================================
echo   AI Learning Adventure - Local Mobile Tester
echo ========================================================
echo.
echo Starting local test server with Phone Simulator...
echo.
echo - PC Browser: Phone Frame Simulator with audio & touch testing
echo - On Phone: You can also open the Network URL on your phone!
echo.

cd /d "%~dp0frontend"
call npm.cmd run dev -- --host --open

pause
