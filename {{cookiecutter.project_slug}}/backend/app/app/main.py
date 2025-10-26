"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import connect_to_mongo, close_mongo_connection, get_database
from .routers import portfolio, prices

# Create FastAPI app
app = FastAPI(
    title="Stock Tracker API",
    description="A stock tracking API for monitoring stock indicators and trading rules",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(portfolio.router)
app.include_router(prices.router)


@app.on_event("startup")
async def startup_db_client():
    """Initialize MongoDB connection on startup."""
    await connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_db_client():
    """Close MongoDB connection on shutdown."""
    await close_mongo_connection()


@app.get("/")
async def root():
    """Root endpoint with welcome message."""
    return {"message": "Welcome to Stock Tracker API!"}


@app.get("/health")
async def health_check():
    """Health check endpoint with MongoDB status."""
    try:
        # Check MongoDB connection
        db = await get_database()
        if db is not None:
            await db.command("ping")
            return {"status": "healthy", "mongodb": "connected"}
        else:
            return {"status": "unhealthy", "mongodb": "disconnected", "error": "Database not initialized"}
    except Exception as e:
        return {"status": "unhealthy", "mongodb": "disconnected", "error": str(e)}


@app.get("/api/v1/")
async def api_root():
    """API status endpoint."""
    return {"message": "API is running", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)