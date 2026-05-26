@echo off
echo ===================================================
echo 🚀 AETHER TASK - QUICK ENVIRONMENT INITIALIZER
echo ===================================================
echo.

:: Inject all standard Node.js installation paths locally
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%APPDATA%\npm;%USERPROFILE%\AppData\Local\Programs\node"

echo 📦 [1/4] Installing Backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to run 'npm install' in the server folder.
    pause
    exit /b %errorlevel%
)

echo.
echo ⚙️  [2/4] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma generate failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 🗄️  [3/4] Initializing SQLite local database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database initialization failed.
    pause
    exit /b %errorlevel%
)

echo.
echo 📦 [4/4] Installing Frontend Client dependencies...
cd ..\client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo 🎉 ALL DONE! SETUP COMPLETE!
echo ===================================================
echo 💡 To run the application, double click: run-dev.bat
echo.
pause
