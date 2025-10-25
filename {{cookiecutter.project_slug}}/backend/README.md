# {{cookiecutter.project_name}} Backend

FastAPI backend with MongoDB integration for hackathon development.

## Features

- **FastAPI** with automatic API documentation
- **MongoDB** integration with Motor async driver
- **Stock Tracking API** for managing stock portfolios
- **Polygon.io API** integration for stock data and validation
- **Docker** support for easy deployment

## Quick Start

1. **Install dependencies:**
   ```bash
   cd backend/app
   pip install -r ../../requirements.txt
   ```

2. **Set up MongoDB:**
   
   **Option A: Local MongoDB**
   ```bash
   # Install MongoDB locally or use Docker
   docker run --rm -p 27017:27017 mongo
   ```
   
   **Option B: MongoDB Atlas (Cloud)**
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Copy your connection string

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB connection string and FMP API key
   ```

4. **Start development server:**
   ```bash
   cd backend/app
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

5. **Access API documentation:**
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## Environment Variables

Create a `.env` file with the following variables:

- `MONGODB_URL`: MongoDB connection string (default: `mongodb://localhost:27017`)
- `DATABASE_NAME`: Database name (default: `stock_tracker`)
- `POLYGON_API_KEY`: Polygon.io API key (required) - Get one at https://polygon.io

## Project Structure

```
backend/
├── app/                    # Application code
│   └── app/
│       └── main.py        # Main FastAPI application
├── backend.dockerfile      # Backend Docker image
└── celeryworker.dockerfile # Celery worker Docker image
```

## API Endpoints

### Stock Management

- `POST /api/v1/stocks/` - Add a stock to portfolio
- `GET /api/v1/stocks/` - Get all stocks (with optional `active_only` filter)
- `GET /api/v1/stocks/{ticker}` - Get a specific stock
- `DELETE /api/v1/stocks/{ticker}` - Remove a stock (soft delete)
- `PATCH /api/v1/stocks/{ticker}/activate` - Reactivate a stock

### Stock Validation & Search

- `GET /api/v1/stocks/validate/{ticker}` - Validate a ticker symbol
- `GET /api/v1/stocks/search/{query}` - Search for stocks
- `GET /api/v1/stocks/details/{ticker}` - Get detailed ticker information

### General

- `GET /` - Welcome message
- `GET /health` - Health check with MongoDB status
- `GET /api/v1/` - API status
- `GET /docs` - API documentation (Swagger)

## Database Schema

Stocks are stored in MongoDB with the following structure:

```json
{
  "_id": "ObjectId",
  "ticker": "AAPL",
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "exchange": "NASDAQ",
  "sector": "Technology",
  "added_at": "2024-01-01T00:00:00",
  "is_active": true
}
```

## Development

The backend uses Motor for async MongoDB operations and includes:
- Type checking with mypy
- Code formatting with black
- HTTP client with httpx

## MongoDB Setup

### Local MongoDB with Docker

```bash
docker run --rm -p 27017:27017 --name mongodb mongo
```

### MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Create a free cluster
3. Click "Connect" and choose "Connect your application"
4. Copy the connection string
5. Update `MONGODB_URL` in your `.env` file

Example connection string:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
