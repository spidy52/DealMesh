@echo off
title DealMesh Ecosystem Launcher
echo ========================================================
echo          STARTING DEALMESH AI COMMERCE ECOSYSTEM
echo ========================================================
echo.
echo [1/4] Starting FastAPI Backend on Port 8000...
start "DealMesh Backend (8000)" cmd /k "python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"

timeout /t 2 >nul

echo [2/4] Starting Buyer Web Portal on Port 5173...
start "DealMesh Buyer Portal (5173)" cmd /k "npm run dev --prefix apps/buyer-web"

echo [3/4] Starting Merchant Studio on Port 5174...
start "DealMesh Merchant Studio (5174)" cmd /k "npm run dev --prefix apps/merchant-web"

timeout /t 2 >nul

echo [4/4] Starting Omni Desktop AI Companion on Windows...
start "Omni Desktop Pet" cmd /k ".\apps\desktop\node_modules\.bin\electron.cmd apps/desktop"

echo.
echo ========================================================
echo   ALL SERVICES STARTED SUCCESSFULLY!
echo ========================================================
echo   - Backend API:       http://localhost:8000/docs
echo   - Buyer Web Portal:  http://localhost:5173
echo   - Merchant Studio:   http://localhost:5174
echo   - Omni Desktop Pet:  Live on your Windows Desktop
echo ========================================================
pause
