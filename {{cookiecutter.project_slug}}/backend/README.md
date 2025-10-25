# {{cookiecutter.project_name}} Backend

FastAPI backend with MongoDB integration for hackathon development.

## Features

- **FastAPI** with automatic API documentation
- **MongoDB** integration with ODMantic ODM
- **JWT Authentication** with magic links
- **User Management** with role-based access
- **Background Tasks** with Celery
- **Docker** support for easy deployment

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend/app
   hatch env create production
   hatch shell
   ```

2. **Start development server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── app/                    # Application code
│   ├── api/               # API endpoints
│   ├── core/              # Core configuration
│   ├── crud/              # Database operations
│   ├── db/                 # Database setup
│   ├── models/             # Data models
│   ├── schemas/            # Pydantic schemas
│   └── utilities/          # Utility functions
├── backend.dockerfile      # Backend Docker image
└── celeryworker.dockerfile # Celery worker Docker image
```

## Environment Variables

- `MONGO_DATABASE_URI`: MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `FIRST_SUPERUSER`: Initial admin user
- `FIRST_SUPERUSER_PASSWORD`: Admin password

## Development

The backend uses Hatch for dependency management and includes:
- Type checking with mypy
- Code formatting with black
- Import sorting with isort
- Testing with pytest

## API Endpoints

- `GET /api/v1/` - API status
- `POST /api/v1/login/` - User authentication
- `GET /api/v1/users/me` - Current user info
- `POST /api/v1/users/` - Create user
- `GET /docs` - API documentation
