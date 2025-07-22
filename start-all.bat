@echo off
echo Starting FoodGuard Application...
echo.

echo [1/4] Installing frontend dependencies...
cd frontend
npm install
echo.

echo [2/4] Installing backend dependencies...
cd ../backend
npm install
echo.

echo [3/4] Installing AI model dependencies...
cd ../ai-model
pip install flask flask-cors pandas scikit-learn opencv-python
echo.

echo [4/4] Starting all services...
echo.
echo Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo Starting AI Model Server (Port 5001)...
start "AI Model Server" cmd /k "cd ai-model && python app.py"
timeout /t 3 /nobreak >nul

echo Starting Frontend Server (Port 5174)...
start "Frontend Server" cmd /k "cd frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo 🎉 All services are starting!
echo ========================================
echo.
echo Frontend: http://localhost:5174
echo Backend:  http://localhost:5000
echo AI Model: http://localhost:5001
echo.
echo Press any key to close this window...
pause >nul 