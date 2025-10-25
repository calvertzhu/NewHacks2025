# NewHacks2025 Hackathon Project

A full-stack FastAPI + Next.js + MongoDB boilerplate for hackathon development.

## Quick Start

1. **Generate your project:**
   ```bash
   pip install cookiecutter
   cookiecutter https://github.com/mongodb-labs/full-stack-fastapi-mongodb.git
   ```

2. **Start development:**
   ```bash
   cd your-project-name
   docker-compose up -d
   ```

3. **Access your app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost/api/
   - API Docs: http://localhost/docs

## What's Included

- **Backend**: FastAPI with MongoDB, authentication, and JWT tokens
- **Frontend**: Next.js with React, TailwindCSS, and Redux
- **Database**: MongoDB with ODMantic ODM
- **Queue**: Celery for background tasks
- **Monitoring**: Flower for task monitoring

## Development

The project uses Docker Compose for easy development. All services are configured to work together out of the box.

For detailed development instructions, see the generated project's README.md file.


# {{cookiecutter.project_name}}

A full-stack web application built with FastAPI, Next.js, and MongoDB.

## Quick Start

1. **Start the development environment:**
   ```bash
   docker-compose up -d
   ```

2. **Access your application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost/api/
   - API Documentation: http://localhost/docs
   - Task Monitor: http://localhost:5555

## Development

### Backend Development

The backend is built with FastAPI and includes:
- MongoDB integration with ODMantic
- JWT authentication with magic links
- User management and permissions
- Background task processing with Celery

### Frontend Development

The frontend is built with Next.js and includes:
- React with TypeScript
- TailwindCSS for styling
- Redux for state management
- Authentication integration

### Database

MongoDB is used as the primary database. The connection is configured in the `.env` file.

## Project Structure

```
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
├── docker-compose.yml # Development environment
└── .env              # Environment configuration
```

## Environment Variables

Key environment variables in `.env`:
- `MONGO_DATABASE_URI`: MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `FIRST_SUPERUSER`: Initial admin user
- `FIRST_SUPERUSER_PASSWORD`: Admin password

## API Documentation

Once running, visit http://localhost/docs for interactive API documentation.

## Background Tasks

Celery is configured for background task processing. Monitor tasks at http://localhost:5555.

## Production Deployment

For production deployment, see the deployment documentation in the original boilerplate.