#!/bin/bash

echo "🚀 Starting AI-Powered Food Waste Tracker..."

# Check if required ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Port $1 is already in use. Please free up the port and try again."
        exit 1
    fi
}

echo "🔍 Checking ports..."
check_port 5000  # Backend
check_port 5001  # AI Model
check_port 5173  # Frontend

# Function to cleanup on exit
cleanup() {
    echo "🧹 Cleaning up..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$AI_MODEL_PID" ]; then
        kill $AI_MODEL_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

echo "📦 Installing dependencies..."

# Install backend dependencies
echo "🔧 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

# Install AI model dependencies
echo "🧠 Installing AI model dependencies..."
cd ../ai-model
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "❌ Failed to install AI model dependencies"
    exit 1
fi

echo "✅ All dependencies installed successfully!"

# Start AI Model
echo "🤖 Starting AI Model..."
cd ../ai-model
python app.py &
AI_MODEL_PID=$!
echo "✅ AI Model started (PID: $AI_MODEL_PID)"

# Wait for AI model to be ready
echo "⏳ Waiting for AI model to be ready..."
sleep 5

# Start Backend
echo "🔧 Starting Backend..."
cd ../backend
npm start &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 5

# Start Frontend
echo "🎨 Starting Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:5000"
echo "🤖 AI Model: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for all processes
wait 