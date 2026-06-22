# AgriSense ML Service

This folder contains the Python FastAPI service used for satellite and NDVI-based analysis. It works with Earth Engine and MongoDB to compute farm-level vegetation insights.

## What this service does

- Exposes HTTP endpoints for health checks and NDVI analysis
- Reads farm boundaries from MongoDB
- Uses Google Earth Engine to process Sentinel-2 imagery
- Computes NDVI values for a selected farm boundary
- Returns a tile URL and summary metrics that can be used by the frontend

## Folder Structure

### `app.py`
Main FastAPI application.

Responsibilities:
- Loads environment variables
- Configures CORS
- Connects to MongoDB
- Initializes the NDVI service
- Initializes Google Earth Engine at startup
- Exposes API routes:
  - `GET /health`
  - `GET /ndvi/{farm_id}`

### `gee/`
Helper code for Google Earth Engine setup.

- `gee_init.py`
  - Initializes Earth Engine in local mode or service-account mode
  - Supports cached local authentication
  - Supports service-account credentials from a key file or JSON string

### `services/`
Business logic for ML and geospatial operations.

- `ndvi_service.py`
  - Loads a farm boundary from MongoDB
  - Builds an Earth Engine geometry from that boundary
  - Filters Sentinel-2 imagery
  - Computes the NDVI composite and average NDVI value
  - Returns the tile URL and summary data

## Supporting files

- `requirements.txt`
  - Python dependencies required by the service

- `.env`
  - Local environment variables such as MongoDB connection strings and Earth Engine settings

- `private-key.json`
  - Service account key file for Earth Engine authentication
  - Keep this file private and do not commit real credentials

- `.venv/`
  - Local Python virtual environment created for development

- `__pycache__/`
  - Python bytecode cache generated automatically by Python

## Environment Variables

Typical variables used by this service include:

- `CORS_ORIGIN`
- `MONGO_URI`
- `MONGO_DB_NAME`
- `MONGO_FARM_COLLECTION`
- `GEE_INIT_MODE`
- `GEE_SERVICE_ACCOUNT`
- `GEE_PRIVATE_KEY_FILE`
- `GEE_PRIVATE_KEY_JSON`

## Run the service

Create and activate a virtual environment, then install dependencies:

```bash
pip install "fastapi[standard]"
pip install -r requirements.txt
```

Start the API with Uvicorn:

```bash
fastapi dev
```

## Notes

- Earth Engine must be authenticated before NDVI requests can succeed.
- If you use service-account mode, make sure the key file path or JSON credential is configured correctly.
- The service reads farm polygons from MongoDB, so the backend farm data must already exist.
