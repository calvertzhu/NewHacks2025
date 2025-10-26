#!/bin/bash

echo "Starting Stock Tracker development environment..."

# Start backend
echo "Starting backend..."
cd backend/app/app
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend..."
cd ../../../frontend
npm run dev &
FRONTEND_PID=$!

echo "Services started!"
echo ""
echo "Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "To stop services: Press Ctrl+C"

# Wait for user to stop
wait
