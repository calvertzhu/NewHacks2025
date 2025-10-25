#!/bin/bash

echo "🚀 Starting {{cookiecutter.project_name}} development environment..."

# Start backend
echo "📦 Starting backend..."
cd backend/app
hatch shell &
BACKEND_PID=$!

# Start frontend
echo "⚛️ Starting frontend..."
cd ../../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Services started!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "📝 To stop services: Press Ctrl+C"

# Wait for user to stop
wait
