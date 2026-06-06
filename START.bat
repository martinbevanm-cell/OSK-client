@echo off
title OSK App Launcher
color 0A

echo.
echo  ========================================
echo   OSK App Launcher
echo  ========================================
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed on this computer.
    echo.
    echo  Please follow these steps:
    echo    1. Open your browser and go to:
    echo       https://nodejs.org/en/download
    echo    2. Click the big green "Download Node.js (LTS)" button
    echo    3. Run the installer (keep clicking Next, use default settings)
    echo    4. Restart your computer after installation
    echo    5. Then double-click START.bat again
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

:: Check Node version is 22 or higher
for /f "tokens=1 delims=v." %%a in ('node --version') do set NODE_MAJOR=%%a
if %NODE_MAJOR% LSS 22 (
    echo  [ERROR] Your Node.js version is too old.
    echo.
    echo  Please download and install a newer version:
    echo    https://nodejs.org/en/download
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

echo  [OK] Node.js is installed.
echo.
echo  Installing app dependencies (this may take a few minutes the first time)...
echo.

call npm install
if errorlevel 1 (
    echo.
    echo  [ERROR] Failed to install dependencies. 
    echo  Please send this window screenshot to your developer.
    pause
    exit /b 1
)

echo.
echo  ========================================
echo   Starting OSK App...
echo  ========================================
echo.
echo  The app will open in your browser automatically.
echo  If it does not open, go to: http://localhost:3000
echo.
echo  DO NOT close this window while using the app.
echo  To stop the app, close this window.
echo.

:: Open browser after a short delay
start "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:3000"

call npm run dev
pause
