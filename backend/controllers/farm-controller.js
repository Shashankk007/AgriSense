import Farm from "../models/Farm.js";
import * as turf from "@turf/turf";

function closeRingIfNeeded(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 3) {
    return coordinates;
  }

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coordinates, first];
  }

  return coordinates;
}

function validateCoordinates(coordinates) {
  return coordinates.every(
    (point) =>
      Array.isArray(point) &&
      point.length === 2 &&
      typeof point[0] === "number" &&
      typeof point[1] === "number" &&
      point[0] >= -180 &&
      point[0] <= 180 &&
      point[1] >= -90 &&
      point[1] <= 90,
  );
}

export async function createFarm(req, res) {
  try {
    const { farmName, coordinates } = req.body;

    if (!farmName) {
      return res.status(400).json({
        message: "Farm name is required",
      });
    }

    if (!coordinates || !Array.isArray(coordinates)) {
      return res.status(400).json({
        message: "Coordinates are required",
      });
    }

    if (!validateCoordinates(coordinates)) {
      return res.status(400).json({
        message: "Invalid coordinates",
      });
    }

    const closedRing = closeRingIfNeeded(coordinates);

    if (closedRing.length < 4) {
      return res.status(400).json({
        message: "Polygon must contain at least 3 points",
      });
    }

    const existingFarm = await Farm.findOne({
      userId: req.user._id,
      farmName,
    });

    if (existingFarm) {
      return res.status(400).json({
        message: "Farm with this name already exists",
      });
    }

    const polygon = turf.polygon([closedRing]);

    const areaSqMeters = turf.area(polygon);

    const areaAcres = areaSqMeters * 0.000247105;

    const farm = await Farm.create({
      userId: req.user._id,

      farmName,

      area: {
        value: Number(areaAcres.toFixed(2)),
        unit: "acre",
      },

      boundary: {
        type: "Polygon",
        coordinates: [closedRing],
      },
    });

    return res.status(201).json({
      success: true,
      farm,
    });
  } catch (error) {
    console.error("createFarm error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create farm",
    });
  }
}

export async function getFarms(req, res) {
  try {
    const farms = await Farm.find({
      userId: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: farms.length,
      farms,
    });
  } catch (error) {
    console.error("getFarms error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch farms",
    });
  }
}

export async function getFarmById(req, res) {
  try {
    const farm = await Farm.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm not found",
      });
    }

    return res.status(200).json({
      success: true,
      farm,
    });
  } catch (error) {
    console.error("getFarmById error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch farm",
    });
  }
}

export async function deleteFarm(req, res) {
  try {
    const farm = await Farm.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!farm) {
      return res.status(404).json({
        success: false,
        message: "Farm not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Farm deleted successfully",
    });
  } catch (error) {
    console.error("deleteFarm error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete farm",
    });
  }
}
