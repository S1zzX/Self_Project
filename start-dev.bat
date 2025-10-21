@echo off
echo Starting development servers...
echo.

REM Start the backend server in a new window
start "Backend Server" cmd /k "cd /d %~dp0server && node server.js"

REM Start the frontend dev server in a new window
start "Frontend Dev Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Frontend: http://localhost:5173 (or check the Vite output)
echo Backend: Check server.js for the port configuration
echo.
echo Close the windows to stop the servers
pause
