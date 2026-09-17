import wrapAsync from "../utils/wrapAsync.js";
import Crop from "../models/Crop.js";
import apiError from "../utils/apiError.js";

export const addCrop = wrapAsync(async (req, res) => {
    const { farmId, cropName, variety, season, sowingDate, expectedHarvestDate } = req.body;
    if (!farmId || !cropName) throw new apiError(400, "farmId and cropName are required");
    const crop = await Crop.create({ farmId, cropName, variety, season, sowingDate, expectedHarvestDate });
    res.status(201).json({ success: true, crop });
});

export const getCrops = wrapAsync(async (req, res) => {
    const { farmId } = req.params;
    const crops = await Crop.find({ farmId });
    res.status(200).json({ success: true, crops });
});

export const updateCrop = wrapAsync(async (req, res) => {
    const { id } = req.params;
    const crop = await Crop.findByIdAndUpdate(id, req.body, { new: true });
    if (!crop) throw new apiError(404, "Crop not found");
    res.status(200).json({ success: true, crop });
});

export const deleteCrop = wrapAsync(async (req, res) => {
    const { id } = req.params;
    await Crop.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Crop deleted" });
});
