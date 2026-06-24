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

    // 5. FastAPI / Dummy ML Execution
    let mlPredictions = [];
    try {
        const FAST_API_URL = process.env.FAST_API_URL || "http://localhost:8000/predict";
        
        // Mocking API predictions format structure mirroring standard formats
        mlPredictions = cloudinaryResults.map((_, index) => ({
            diseaseName: index === 0 ? "Tomato Late Blight" : "Healthy",
            confidenceScore: index === 0 ? 94.5 : 99.1,
            isHealthy: index !== 0,
            severity: index === 0 ? "High" : "None",
            diseaseType: index === 0 ? "Fungal" : "None",
            affectedPart: "Leaf",
            cause: index === 0 ? "Phytophthora infestans" : "None",
            precautions: index === 0 ? ["Remove infected leaves", "Avoid overhead watering"] : ["Maintain current schedule"],
            treatments: index === 0 ? ["Apply copper-based fungicide"] : ["None"]
        }));
    } catch (error) {
        console.error("FastAPI Error:", error);
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