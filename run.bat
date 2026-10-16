@echo off
title eFVerse Launcher
echo ===================================================
echo           eFVerse Development Launcher
echo ===================================================
echo.

:: Detect Node.js
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    set "NODE_CMD=node"
) else (
    if exist "%~dp0frontend\node_modules\node\bin\node.exe" (
        set "NODE_CMD=%~dp0frontend\node_modules\node\bin\node.exe"
        echo [INFO] Using bundled Node.js: %NODE_CMD%
    ) else (
        echo [ERROR] Node.js is not installed or not in PATH!
        echo Please install Node.js via: winget install OpenJS.NodeJS.LTS
        pause
        exit /b 1
    )
)

echo [1/2] Starting Backend Server (Port 5001)...
start "eFVerse Backend (Port 5001)" cmd /k "cd /d "%~dp0backend" && "%NODE_CMD%" src/server.js"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "eFVerse Frontend (Port 5173)" cmd /k "cd /d "%~dp0frontend" && "%NODE_CMD%" ./node_modules/vite/bin/vite.js"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173...
start http://localhost:5173

echo.
echo ===================================================
echo  eFVerse is now running!
echo  Backend:  http://localhost:5001
echo  Frontend: http://localhost:5173
echo ===================================================
echo.
