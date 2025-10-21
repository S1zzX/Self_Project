# Start both the Vite dev server and Node backend server concurrently

Write-Host "Starting development servers..." -ForegroundColor Green

# Start the backend server in a new PowerShell window
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node server.js" -PassThru

# Start the frontend dev server in a new PowerShell window
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -PassThru

Write-Host "Both servers are starting..." -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173 (or check the Vite output)" -ForegroundColor Yellow
Write-Host "Backend: Check server.js for the port configuration" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C in each window to stop the servers" -ForegroundColor Red
