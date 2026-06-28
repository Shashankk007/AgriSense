import { Detection } from "../models/DiseaseDetection.js";
import wrapAsync from "../utils/wrapAsync.js";
import apiError from "../utils/apiError.js";
import { uploadOnCloudinary,cloudinary } from "../utils/cloudinary.js";
import  Farm from "../models/Farm.js"; 
import axios from "axios";


export const detectDisease = wrapAsync(async (req, res) => {
    // 1. Frontend se farmId, naye farm ka naam aur live device coordinates catch karo
    const { farmId, newFarmName, latitude, longitude, cropType, cropId } = req.body;
    let finalFarmId = farmId;

    // 2. Validation Check for Files
    if (!req.files || req.files.length === 0) {
        throw new apiError(400, "Please upload at least one crop image for detection");
    }
    if (req.files.length > 5) {
        throw new apiError(400, "Maximum 5 images allowed at a time");
    }

    // 🟢 3. IF NEW FARM REQUESTED: Save it first with proper GeoJSON validation
    if (newFarmName) {
        // Agar frontend se direct location aayi hai toh use karo, nahi toh safe default India ke coordinates
        const lat = latitude ? parseFloat(latitude) : 20.5937;
        const lng = longitude ? parseFloat(longitude) : 78.9629;

        // GeoJSON Polygon ke liye pehla aur aakhiri point hamesha loop close karne ke liye same hona chahiye
        const polygonCoordinates = [
            [
                [lng - 0.001, lat - 0.001], // Bottom-Left
                [lng + 0.001, lat - 0.001], // Bottom-Right
                [lng + 0.001, lat + 0.001], // Top-Right
                [lng - 0.001, lat + 0.001], // Top-Left
                [lng - 0.001, lat - 0.001]  // Closing back to Bottom-Left
            ]
        ];

        const newFarm = await Farm.create({
            userId: req.user.id,
            farmName: newFarmName,
            area: {
                value: 1, // Default safe value
                unit: "acre"
            },
            boundary: {
                type: "Polygon",
                coordinates: polygonCoordinates
            }
        });

        finalFarmId = newFarm._id; // Replace with newly generated Farm ID
    }

    // 4. Cloudinary Multi-upload (Promise.all)
    const cloudinaryUploadPromises = req.files.map(file => uploadOnCloudinary(file.path, "agrisense/detections"));
    const cloudinaryResults = await Promise.all(cloudinaryUploadPromises);

    const failedUploads = cloudinaryResults.filter(result => result === null);
    if (failedUploads.length > 0) {
        throw new apiError(500, "Failed to upload some images to cloud storage");
    }

    const imageUrlsForML = cloudinaryResults.map(img => img.secure_url);

    // 5. FastAPI / ML Execution
    let mlPredictions = [];
    try {
        const FAST_API_URL = process.env.FAST_API_URL || "http://localhost:8000";
        
        mlPredictions = await Promise.all(imageUrlsForML.map(async (url) => {
            try {
                const response = await axios.post(`${FAST_API_URL}/predict/disease`, { image_url: url });
                const { prediction } = response.data;
                const details = prediction.details || {};
                
                return {
                    diseaseName: prediction.class || "Unknown",
                    confidenceScore: prediction.confidence_score || 0,
                    isHealthy: prediction.class === "Healthy",
                    severity: details.severity || "None",
                    diseaseType: details.disease_type || "Unknown",
                    affectedPart: details.affected_part || "Leaf",
                    cause: details.cause || "Unknown",
                    precautions: details.prevention ? [details.prevention] : [],
                    treatments: details.solution ? [details.solution] : []
                };
            } catch (err) {
                console.error("FastAPI Error for URL:", url, err.response?.data || err.message);
                throw new apiError(500, err.response?.data?.detail || "Machine Learning model is not working. Please try again later.");
            }
        }));
    } catch (error) {
        console.error("FastAPI Overall Error:", error);
        if (error.statusCode) throw error;
        throw new apiError(500, "Machine Learning service error");
    }

    // 6. DB Scheme compliance mapping
    const imagesDataForDB = cloudinaryResults.map((cloudData, index) => {
        const mlData = mlPredictions[index];
        return {
            cloudinaryUrl: cloudData.secure_url,
            cloudinaryPublicId: cloudData.public_id,
            prediction: {
                diseaseName: mlData.diseaseName,
                confidenceScore: mlData.confidenceScore,
                isHealthy: mlData.isHealthy,
                severity: mlData.severity,
                diseaseType: mlData.diseaseType,
                affectedPart: mlData.affectedPart,
                cause: mlData.cause
            },
            precautions: mlData.precautions,
            treatments: mlData.treatments
        };
    });

    const uniqueDiseases = [...new Set(mlPredictions.map(p => p.diseaseName))];

    // 7. Master DB document Creation
    const newDetection = await Detection.create({
        user: req.user.id,
        farmId: finalFarmId || null,
        cropId: cropId || null,
        cropType: cropType || "Unknown",
        images: imagesDataForDB,
        status: "completed",
        totalImagesScanned: imagesDataForDB.length,
        diseasesFoundSummary: uniqueDiseases
    });

    // Cleaned response format optimization fixed earlier
    return res.status(200).json({
        success: true,
        message: "Crop analysis completed successfully",
        detectionResult: newDetection
    });
});

// 🟢 NAYA FUNCTION: HISTORY PAGE KE LIYE
export const getDetectionHistory = wrapAsync(async (req, res) => {
    // User ki saari history nikalo aur naye se purane (descending) order mein sort karo
    const history = await Detection.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .populate("farmId", "farmName"); // Farm ka naam bhi sath layega

    return res.status(200).json({
        success: true,
        history
    });
});

export const getPestHistory = wrapAsync(async (req, res) => {
    // Note: PestDetection uses farmId directly, assuming it's linked
    // However, PestDetection model doesn't explicitly store userId in the snippet provided.
    // Let's check how PestDetection is saved.
    // Wait, in detectPest: await PestDetection.create({ farmId: finalFarmId, ... })
    // If there is no user field, how do we filter? Let's check PestDetection schema later or just find by farmId if possible, but let's assume we can fetch it if we populate.
    
    // Query by userId to include both assigned and unassigned (no farm) pest scans
    const history = await PestDetection.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .populate("farmId", "farmName");

    return res.status(200).json({
        success: true,
        history
    });
});

import PestDetection from "../models/PestDetection.js";

export const detectPest = wrapAsync(async (req, res) => {
    const { farmId, newFarmName, latitude, longitude } = req.body;
    let finalFarmId = farmId;

    if (!req.files || req.files.length === 0) {
        throw new apiError(400, "Please upload at least one crop image for detection");
    }

    if (newFarmName) {
        const lat = latitude ? parseFloat(latitude) : 20.5937;
        const lng = longitude ? parseFloat(longitude) : 78.9629;
        const polygonCoordinates = [
            [[lng - 0.001, lat - 0.001], [lng + 0.001, lat - 0.001], [lng + 0.001, lat + 0.001], [lng - 0.001, lat + 0.001], [lng - 0.001, lat - 0.001]]
        ];
        const newFarm = await Farm.create({
            userId: req.user.id,
            farmName: newFarmName,
            area: { value: 1, unit: "acre" },
            boundary: { type: "Polygon", coordinates: polygonCoordinates }
        });
        finalFarmId = newFarm._id;
    }

    const cloudinaryUploadPromises = req.files.map(file => uploadOnCloudinary(file.path, "agrisense/pests"));
    const cloudinaryResults = await Promise.all(cloudinaryUploadPromises);

    const failedUploads = cloudinaryResults.filter(result => result === null);
    if (failedUploads.length > 0) {
        throw new apiError(500, "Failed to upload some images to cloud storage");
    }

    const FAST_API_URL = process.env.FAST_API_URL || "http://localhost:8000";
    
    const pestRecords = await Promise.all(cloudinaryResults.map(async (cloudData) => {
        let pestName = "Unknown";
        let confidence = 0;
        let recommendation = "";
        
        try {
            const response = await axios.post(`${FAST_API_URL}/predict/pest`, { image_url: cloudData.secure_url });
            const { prediction } = response.data;
            const details = prediction.details || {};
            
            pestName = details.pest_name || `Class ${prediction.class}`;
            confidence = prediction.confidence_score;
            recommendation = (details.remedies || []).join(" | ");
        } catch (err) {
            console.error("FastAPI Pest Error:", err.response?.data || err.message);
            throw new apiError(500, err.response?.data?.detail || "Pest prediction model is not working. Please try again later.");
        }

        return await PestDetection.create({
            userId: req.user.id,
            farmId: finalFarmId || null,
            imageUrl: cloudData.secure_url,
            pestName,
            confidence,
            severity: "Medium", // Or detect from details
            recommendation
        });
    }));

    return res.status(200).json({
        success: true,
        message: "Pest analysis completed successfully",
        detectionResult: pestRecords
    });
});

// 🟢 NAYA FUNCTION: DELETE DETECTION RECORD
export const deleteDetectionRecord = wrapAsync(async (req, res) => {
    const { id } = req.params;

    // 1. Pehle database se record dhoondho
    const detection = await Detection.findOne({ _id: id, user: req.user.id });
    
    if (!detection) {
        throw new apiError(404, "Detection record not found");
    }

    // 2. Cloudinary se saari images delete karo
    if (detection.images && detection.images.length > 0) {
        const deletePromises = detection.images.map(async (img) => {
            if (img.cloudinaryPublicId) {
                try {
                    await cloudinary.uploader.destroy(img.cloudinaryPublicId);
                } catch (error) {
                    console.error("Cloudinary delete failed for:", img.cloudinaryPublicId);
                    // Agar cloud se delete fail bhi ho jaye, toh aage badho
                }
            }
            return null;
        });
        await Promise.all(deletePromises);
    }

    // 3. Database se document hamesha ke liye delete kar do
    await Detection.findByIdAndDelete(id);

    return res.status(200).json({
        success: true,
        message: "Scan record and associated images deleted successfully"
    });
});