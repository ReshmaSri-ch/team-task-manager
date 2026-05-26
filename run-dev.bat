@echo off
echo ===================================================
echo 🚀 AETHER TASK - DEVELOPMENT SERVERS LAUNCHER
echo ===================================================
echo.

:: Inject all standard Node.js installation paths locally to bypass stale environment variables
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%APPDATA%\npm;%USERPROFILE%\AppData\Local\Programs\node"

echo ⚡ Spin-locking Express API Backend (Port 5000)...
start "Aether Task Backend API" cmd /k "cd server && npm run dev"

echo ⚡ Spin-locking Vite React Frontend (Port 3000)...
start "Aether Task Client UI" cmd /k "cd client && npm run dev"

echo.
echo 🎉 BOTH SERVICES RUNNING IN SEPARATE TERMINALS!
echo.
echo 🔗 Web Interface: http://localhost:3000
echo 🔗 REST API Endpoint: http://localhost:5000/api/health
echo.
echo 💡 Close the separate terminals or press any key to exit.
echo ===================================================
pause
