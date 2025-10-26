"""
MongoDB database configuration and connection management.
"""
import os
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB configuration
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "stock_tracker")

# Global MongoDB client and database instances
mongodb_client: Optional[AsyncIOMotorClient] = None
mongodb_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo():
    """Initialize MongoDB connection."""
    global mongodb_client, mongodb_database
    mongodb_client = AsyncIOMotorClient(MONGODB_URL)
    mongodb_database = mongodb_client[DATABASE_NAME]
    # Mask credentials in connection string for security
    masked_url = MONGODB_URL.split('@')[-1] if '@' in MONGODB_URL else MONGODB_URL
    print(f"Connected to MongoDB at {masked_url}")


async def close_mongo_connection():
    """Close MongoDB connection."""
    global mongodb_client
    if mongodb_client:
        mongodb_client.close()
        print("MongoDB connection closed")


async def get_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    return mongodb_database


async def get_collection(collection_name: str = "Portfolio"):
    """Get a specific collection from the database."""
    db = await get_database()
    return db[collection_name]
