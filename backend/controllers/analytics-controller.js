import wrapAsync from "../utils/wrapAsync.js";
import CropHealth from "../models/CropHealth.js";
import SatelliteData from "../models/SatellitData.js";
import YieldPrediction from "../models/YieldPrediction.js";
import apiError from "../utils/apiError.js";

export const getHealth = wrapAsync(async (req, res) => {
    const data = await CropHealth.find({ farmId: req.params.farmId }).sort("-date");
    res.status(200).json({ success: true, data });
});

export const getSatellite = wrapAsync(async (req, res) => {
    const data = await SatelliteData.find({ farmId: req.params.farmId }).sort("-date");
    res.status(200).json({ success: true, data });
});

export const getYield = wrapAsync(async (req, res) => {
    const data = await YieldPrediction.find({ farmId: req.params.farmId }).sort("-predictionDate");
    res.status(200).json({ success: true, data });
});
