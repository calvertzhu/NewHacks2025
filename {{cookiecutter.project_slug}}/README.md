# {{cookiecutter.project_name}}

A simplified full-stack web application built with FastAPI, Next.js, and MongoDB.

## Quick Start

1. **Install dependencies:**
   ```bash
   # Backend
   cd backend/app
   hatch env create production
   
   # Frontend
   cd ../../frontend
   npm install
   ```

2. **Start development:**
   ```bash
   ./start.sh
   ```

3. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Project Structure

```
{{cookiecutter.project_slug}}/
├── backend/          # FastAPI backend
│   └── app/         # Backend application
├── frontend/         # Next.js frontend
│   └── app/         # Frontend application
├── start.sh         # Development startup script
└── README.md        # This file
```

## Development

### Backend (FastAPI)
- **Location:** `backend/app/`
- **Start:** `cd backend/app && hatch shell && uvicorn app.main:app --reload`
- **API Docs:** http://localhost:8000/docs

### Frontend (Next.js)
- **Location:** `frontend/`
- **Start:** `cd frontend && npm run dev`
- **URL:** http://localhost:3000

## Features

- ✅ **FastAPI** backend with automatic API documentation
- ✅ **Next.js** frontend with React and TypeScript
- ✅ **MongoDB** integration with ODMantic
- ✅ **TailwindCSS** for styling
- ✅ **JWT Authentication** (basic setup)
- ✅ **User Management** (CRUD operations)

## Hackathon Ready

This template is optimized for hackathon development with:
- Essential features only
- Clean, simple structure
- Easy to understand and modify
- Quick setup and deployment