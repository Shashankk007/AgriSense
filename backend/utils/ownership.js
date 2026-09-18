import mongoose from "mongoose";
import Farm from "../models/Farm.js";
import apiError from "./apiError.js";

// Returns the farm only if it belongs to the given user; otherwise throws 404.
export const requireOwnedFarm = async (farmId, userId) => {
    if (!mongoose.isValidObjectId(farmId)) {
        throw new apiError(400, "Invalid farm id");
    }
    const farm = await Farm.findOne({ _id: farmId, userId });
    if (!farm) {
        throw new apiError(404, "Farm not found");
    }
    return farm;
};

// Picks only the allowed keys so clients can't overwrite ownership fields.
export const pick = (obj = {}, keys) =>
    Object.fromEntries(keys.filter((k) => obj[k] !== undefined).map((k) => [k, obj[k]]));
