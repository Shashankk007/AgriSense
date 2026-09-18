from datetime import datetime, timedelta, timezone

import ee
from bson import ObjectId
from fastapi import HTTPException


class NDVIService:
    def __init__(self, mongo_db, farm_collection_name: str):
        self.mongo_db = mongo_db
        self.farms = self.mongo_db[farm_collection_name]

    def _get_farm(self, farm_id: str):
        try:
            oid = ObjectId(farm_id)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Invalid farm id.") from exc

        farm = self.farms.find_one({"_id": oid})
        if not farm:
            raise HTTPException(status_code=404, detail="Farm not found.")
        return farm

    def _farm_geometry(self, farm):
        coordinates = farm.get("boundary", {}).get("coordinates")
        if not coordinates or not coordinates[0]:
            raise HTTPException(status_code=400, detail="Farm boundary is missing.")
        return ee.Geometry.Polygon(coordinates)

    def compute_ndvi(self, farm_id: str):
        # Read farm polygon from MongoDB so Earth Engine can analyze that exact boundary.
        farm = self._get_farm(farm_id)
        geometry = self._farm_geometry(farm)

        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=90)

        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(geometry)
            .filterDate(str(start_date), str(end_date))
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 20))
        )

        if collection.size().getInfo() == 0:
            raise HTTPException(
                status_code=404,
                detail="No Sentinel-2 imagery found for this farm in the last 90 days.",
            )

        composite = collection.median()
        # NDVI = (NIR - RED) / (NIR + RED) using Sentinel-2 bands B8 and B4.
        ndvi = composite.normalizedDifference(["B8", "B4"]).rename("NDVI").clip(geometry)

        vis_params = {
            "min": 0,
            "max": 1,
            "palette": ["red", "orange", "yellow", "green"],
        }

        map_id = ndvi.visualize(**vis_params).getMapId()
        tile_url = map_id["tile_fetcher"].url_format

        reducer_result = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry,
            scale=10,
            maxPixels=1_000_000_000,
            bestEffort=True,
        )

        average_ndvi = reducer_result.get("NDVI").getInfo()
        if average_ndvi is None:
            average_ndvi = 0

        # Date of the most recent Sentinel-2 scene that went into the composite.
        latest_ms = collection.aggregate_max("system:time_start").getInfo()
        if latest_ms:
            last_updated = datetime.fromtimestamp(latest_ms / 1000, tz=timezone.utc).isoformat()
        else:
            last_updated = datetime.now(timezone.utc).isoformat()

        return {
            "tileUrl": tile_url,
            "imageCount": collection.size().getInfo(),
            "averageNdvi": float(average_ndvi),
            "farmName": farm.get("farmName", "Unknown Farm"),
            "lastUpdated": last_updated,
        }
