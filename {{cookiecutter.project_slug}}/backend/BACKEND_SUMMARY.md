# Backend File Structure & Explanation

## 📁 File Structure

```
backend/
├── app/
│   └── app/
│       ├── __init__.py           # Package initialization (empty)
│       ├── main.py               # ⭐ MAIN APPLICATION - FastAPI setup
│       ├── database.py           # ⭐ MongoDB Atlas connection
│       ├── models.py             # ⭐ Pydantic data models
│       ├── services.py           # ⭐ Polygon.io API integration
│       └── routers/
│           ├── __init__.py       # Router package init
│           └── portfolio.py      # ⭐ All API endpoints
├── .env                          # Environment variables (KEEP PRIVATE!)
├── .gitignore                    # Git ignore rules
├── backend.dockerfile            # Docker configuration
└── README.md                     # Documentation

```

---

## 📝 File Explanations

### ⭐ `main.py` (69 lines)
**Purpose**: FastAPI application entry point

**Key Functions**:
- Creates FastAPI app instance
- Configures CORS middleware (allows frontend requests)
- Imports and includes the portfolio router
- Sets up MongoDB connection on startup
- Defines health check endpoint
- Can be run directly with `python main.py`

**Key Code**:
```python
app = FastAPI()  # Creates the API
app.include_router(portfolio.router)  # Adds all endpoints
```

---

### ⭐ `database.py` (46 lines)
**Purpose**: MongoDB Atlas connection management

**Key Functions**:
- `connect_to_mongo()` - Connects to MongoDB Atlas
- `close_mongo_connection()` - Closes connection
- `get_database()` - Returns database instance
- `get_collection()` - Returns "Portfolio" collection

**Configuration**:
- Reads `MONGODB_URL` from `.env` (your Atlas connection string)
- Reads `DATABASE_NAME` from `.env` (currently "CSB")

---

### ⭐ `models.py` (30 lines)
**Purpose**: Pydantic models for request/response validation

**Models**:
1. **StockCreate** - For POST requests to add stocks
   ```python
   {
     "ticker": "AAPL",  # Required
     "name": "Apple Inc.",  # Optional
     "sector": "Technology"  # Optional
   }
   ```

2. **StockResponse** - What the API returns
   ```python
   {
     "id": "...",
     "ticker": "AAPL",
     "symbol": "AAPL",
     "name": "Apple Inc.",
     "exchange": "XNAS",
     "sector": "Technology",
     "added_at": "2024-10-25T...",
     "is_active": true
   }
   ```

---

### ⭐ `services.py` (108 lines)
**Purpose**: External API integration with Polygon.io

**Key Functions**:
1. `validate_ticker_with_polygon(ticker)` - Validates if ticker exists
2. `search_stocks(query, limit)` - Searches for stocks
3. `get_ticker_details(ticker)` - Gets detailed ticker info

**API Calls**: All functions call `https://api.polygon.io/v3/reference/tickers`

---

### ⭐ `routers/portfolio.py` (191 lines)
**Purpose**: All REST API endpoints for portfolio management

**Endpoints**:
1. `POST /api/v1/stocks/` - Add stock to portfolio
2. `GET /api/v1/stocks/` - Get all stocks
3. `GET /api/v1/stocks/{ticker}` - Get specific stock
4. `DELETE /api/v1/stocks/{ticker}` - Remove stock (soft delete)
5. `PATCH /api/v1/stocks/{ticker}/activate` - Reactivate stock
6. `GET /api/v1/stocks/validate/{ticker}` - Validate ticker
7. `GET /api/v1/stocks/search/{query}` - Search stocks
8. `GET /api/v1/stocks/details/{ticker}` - Get ticker details

**Features**:
- Validates tickers with Polygon.io
- Checks portfolio limit (max 10 stocks)
- Prevents duplicates
- Soft delete (marks inactive instead of deleting)
- Saves to MongoDB Atlas "Portfolio" collection

---

### 📄 `.env` (PRIVATE - DO NOT COMMIT!)
**Purpose**: Stores sensitive configuration

**Contains**:
```env
POLYGON_API_KEY=c2qFkQXOLfm6tvU489Rr83thDR_M38la
MONGODB_URL=mongodb+srv://zhucalvert_db_user:password@newhacks.ukdscwx.mongodb.net/
DATABASE_NAME=CSB
```

---

## 🔄 How It All Works Together

### Example: Adding AAPL Stock

1. **Frontend** sends POST request to `/api/v1/stocks/` with `{"ticker": "AAPL"}`

2. **main.py** receives request and routes to `portfolio.router`

3. **portfolio.py** calls:
   - `get_collection()` → Gets MongoDB "Portfolio" collection
   - `validate_ticker_with_polygon("AAPL")` → Checks with Polygon.io
   - If valid, creates stock document
   - Saves to MongoDB Atlas
   - Returns `StockResponse` to frontend

4. **database.py** handles all MongoDB operations

5. **models.py** validates the request data

6. **services.py** fetches stock data from Polygon.io

---

## 🚀 Running the Backend

```bash
cd app/app
python main.py
# Or with uvicorn:
uvicorn app.main:app --reload --port 8000
```

Then visit:
- API Docs: http://localhost:8000/docs
- Portfolio: http://localhost:8000/api/v1/stocks/

---

## 📊 Current Database State

- **Database**: CSB (MongoDB Atlas)
- **Collection**: Portfolio
- **Current Stocks**: TSLA, AAPL
- **Total**: 2 stocks

---

## ✅ Summary

Your backend has a clean, modular structure:
- **main.py** = Application setup
- **database.py** = MongoDB connection
- **models.py** = Data validation
- **services.py** = External APIs
- **routers/portfolio.py** = API endpoints

All files work together to provide a RESTful API for stock portfolio management with MongoDB persistence!
