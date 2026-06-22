import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient

from gee.gee_init import initialize_gee
from services.ndvi_service import NDVIService

load_dotenv()

app = FastAPI(title="AgriSense NDVI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/agrisense")
mongo_db_name = os.getenv("MONGO_DB_NAME", "agrisense")
farm_collection = os.getenv("MONGO_FARM_COLLECTION", "farms")

mongo_client = MongoClient(mongo_uri)
mongo_db = mongo_client[mongo_db_name]
ndvi_service = NDVIService(mongo_db, farm_collection)
gee_ready = False
gee_error = ""


@app.on_event("startup")
def startup_event():
    global gee_ready, gee_error
    try:
        init_mode = initialize_gee()
        gee_ready = True
        gee_error = ""
        print(f"Google Earth Engine initialized ({init_mode})")
    except Exception as exc:
        gee_ready = False
        gee_error = str(exc)
        print(f"Google Earth Engine initialization deferred: {gee_error}")


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/ndvi/{farm_id}")
def get_ndvi(farm_id: str):
    if not gee_ready:
        raise HTTPException(
            status_code=503,
            detail=(
                "Google Earth Engine is not initialized. "
                f"{gee_error}"
            ),
        )
    return ndvi_service.compute_ndvi(farm_id)
