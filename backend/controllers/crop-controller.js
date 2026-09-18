import wrapAsync from "../utils/wrapAsync.js";
import Crop from "../models/Crop.js";
import apiError from "../utils/apiError.js";
import Farm from "../models/Farm.js";
import { requireOwnedFarm, pick } from "../utils/ownership.js";

const UPDATABLE_FIELDS = ["cropName", "variety", "season", "sowingDate", "expectedHarvestDate", "status"];

// Loads a crop and verifies its farm belongs to the current user.
const requireOwnedCrop = async (cropId, userId) => {
    const crop = await Crop.findById(cropId);
    if (!crop) throw new apiError(404, "Crop not found");
    const farm = await Farm.findOne({ _id: crop.farmId, userId });
    if (!farm) throw new apiError(404, "Crop not found");
    return crop;
};

export const addCrop = wrapAsync(async (req, res) => {
    const { farmId, cropName, variety, season, sowingDate, expectedHarvestDate } = req.body;
    if (!farmId || !cropName) throw new apiError(400, "farmId and cropName are required");
    await requireOwnedFarm(farmId, req.user._id);
    const crop = await Crop.create({ farmId, cropName, variety, season, sowingDate, expectedHarvestDate });
    res.status(201).json({ success: true, crop });
});

export const getCrops = wrapAsync(async (req, res) => {
    const { farmId } = req.params;
    await requireOwnedFarm(farmId, req.user._id);
    const crops = await Crop.find({ farmId });
    res.status(200).json({ success: true, crops });
});

export const updateCrop = wrapAsync(async (req, res) => {
    const crop = await requireOwnedCrop(req.params.id, req.user._id);
    Object.assign(crop, pick(req.body, UPDATABLE_FIELDS));
    await crop.save();
    res.status(200).json({ success: true, crop });
});

export const deleteCrop = wrapAsync(async (req, res) => {
    const crop = await requireOwnedCrop(req.params.id, req.user._id);
    await crop.deleteOne();
    res.status(200).json({ success: true, message: "Crop deleted" });
});
