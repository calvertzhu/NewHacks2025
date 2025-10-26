#!/bin/bash

echo "🚀 Setting up Hackathon Project..."

# Create root virtual environment
echo "Setting up Python environment..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "All Python dependencies installed"

# Install frontend dependencies
echo "⚛️ Setting up frontend..."
cd frontend
npm install
echo "Frontend dependencies installed"

# Create .env file if it doesn't exist
echo "Creating environment file..."
cd ..
if [ ! -f .env ]; then
    cat > .env << EOF
# Backend Configuration
SECRET_KEY=your-secret-key-here
MONGO_DATABASE_URI=mongodb://localhost:27017/hackathon
MONGO_DATABASE=hackathon
FIRST_SUPERUSER=admin@example.com
FIRST_SUPERUSER_PASSWORD=changethis

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
EOF
    echo "Environment file created"
else
    echo "Environment file already exists"
fi

echo ""
echo "Setup complete!"
echo ""
echo "To start development:"
echo "  Backend:  source venv/bin/activate && cd backend && uvicorn app.main:app --reload"
echo "  Frontend: cd frontend && npm run dev"
echo "  Or use:   ./start.sh"
echo ""
echo "Access your app:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
