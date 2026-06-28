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
        # -----------------------------
        # Fetch Farm
        # -----------------------------
        farm = self._get_farm(farm_id)
        geometry = self._farm_geometry(farm)

        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=45)

        # -----------------------------
        # Cloud Mask using SCL band
        # -----------------------------
        def mask_s2_clouds(image):
            scl = image.select("SCL")

            # Keep:
            # 4 = Vegetation
            # 5 = Bare Soil
            # 6 = Water (optional)
            # Remove:
            # 3 = Cloud Shadow
            # 8 = Cloud Medium Probability
            # 9 = Cloud High Probability
            # 10 = Thin Cirrus
            # 11 = Snow

            mask = (
                scl.neq(3)
                .And(scl.neq(8))
                .And(scl.neq(9))
                .And(scl.neq(10))
                .And(scl.neq(11))
            )

            return image.updateMask(mask)

        # -----------------------------
        # Sentinel Collection
        # -----------------------------
        collection = (
            ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
            .filterBounds(geometry)
            .filterDate(str(start_date), str(end_date))
            .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
            .map(mask_s2_clouds)
        )

        if collection.size().getInfo() == 0:
            raise HTTPException(
                status_code=404,
                detail="No Sentinel-2 imagery found for this farm."
            )

        # -----------------------------
        # Composite
        # -----------------------------
        composite = collection.median()

        # -----------------------------
        # NDVI
        # -----------------------------
        ndvi = (
            composite
            .normalizedDifference(["B8", "B4"])
            .rename("NDVI")
            .clip(geometry)
        )

        # -----------------------------
        # Visualization
        # -----------------------------
        vis_params = {
            "min": 0,
            "max": 1,
            "palette": [
                "#8B0000",
                "#FF0000",
                "#FFA500",
                "#FFFF00",
                "#ADFF2F",
                "#008000",
                "#006400"
            ]
        }

        map_id = ndvi.visualize(**vis_params).getMapId()
        tile_url = map_id["tile_fetcher"].url_format

        # -----------------------------
        # Average NDVI
        # -----------------------------
        average_ndvi = ndvi.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=geometry,
            scale=10,
            maxPixels=1e9,
            bestEffort=True
        ).get("NDVI")

        average_ndvi = average_ndvi.getInfo()

        if average_ndvi is None:
            average_ndvi = 0

        # -----------------------------
        # Area Calculations
        # -----------------------------
        pixel_area = ee.Image.pixelArea().divide(10000)

        healthy = (
            ndvi.gt(0.6)
            .multiply(pixel_area)
            .reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=geometry,
                scale=10,
                maxPixels=1e9
            )
            .get("NDVI")
        )

        moderate = (
            ndvi.gte(0.4)
            .And(ndvi.lte(0.6))
            .multiply(pixel_area)
            .reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=geometry,
                scale=10,
                maxPixels=1e9
            )
            .get("NDVI")
        )

        poor = (
            ndvi.lt(0.4)
            .multiply(pixel_area)
            .reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=geometry,
                scale=10,
                maxPixels=1e9
            )
            .get("NDVI")
        )

        total_area = pixel_area.reduceRegion(
            reducer=ee.Reducer.sum(),
            geometry=geometry,
            scale=10,
            maxPixels=1e9
        ).get("area")

        healthy = healthy.getInfo() or 0
        moderate = moderate.getInfo() or 0
        poor = poor.getInfo() or 0
        total_area = total_area.getInfo() or 0

        if total_area == 0:
            healthy_percent = 0
            moderate_percent = 0
            poor_percent = 0
        else:
            healthy_percent = round((healthy / total_area) * 100, 2)
            moderate_percent = round((moderate / total_area) * 100, 2)
            poor_percent = round((poor / total_area) * 100, 2)

        created_at = farm.get("createdAt")

        return {
            "farmId": str(farm["_id"]),
            "farmName": farm.get("farmName", "Unknown Farm"),
            "tileUrl": tile_url,
            "averageNdvi": round(float(average_ndvi), 3),
            "farmAreaHectares": round(total_area, 2),
            "health": {
                "healthyPercent": healthy_percent,
                "moderatePercent": moderate_percent,
                "poorPercent": poor_percent
            },
            "lastUpdated": (
                created_at.isoformat()
                if created_at
                else datetime.now(timezone.utc).isoformat()
            )
        }