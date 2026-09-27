@echo off
title AI Learning Adventure - One-Click APK Builder
cls
echo ========================================================
echo   AI Learning Adventure - One-Click APK Builder
echo ========================================================
echo.

set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk

echo [1/3] Building frontend bundle...
cd /d "%~dp0frontend"
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/3] Syncing assets with Capacitor Android...
call npx.cmd cap sync android
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [3/3] Compiling Android APK with Gradle...
cd /d "%~dp0frontend\android"
call gradlew.bat assembleDebug
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Gradle build failed!
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Copying APK to project root...
copy /y "%~dp0frontend\android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0ai-learning-adventure.apk"

echo.
echo ========================================================
echo   SUCCESS! New APK is ready:
echo   %~dp0ai-learning-adventure.apk
echo ========================================================
echo.
pause
