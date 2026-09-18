import DiseaseDetection from "../models/DiseaseDetection.js";
import PestDetection from "../models/PestDetection.js";
import apiError from "../utils/apiError.js";
import { cloudinary, ensureCloudinaryConfig, uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadDetectionImage = async (localFilePath, folder) => {
    const uploadedImage = await uploadOnCloudinary(localFilePath, folder);

    if (!uploadedImage) {
        throw new apiError(500, "Image upload to Cloudinary failed. Check your CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env");
    }

    return uploadedImage;
};

export const uploadDiseaseImage = async (req, res) => {
    try {
        if (!req.file) {
            throw new apiError(400, "Image is required");
        }

        const uploadedImage = await uploadDetectionImage(
            req.file.path,
            "agrisense/disease-detections"
        );

        const detection = await DiseaseDetection.create({
            user: req.user._id,
            imageUrl: uploadedImage.secure_url,
            cloudinaryId: uploadedImage.public_id,
        });

        res.status(201).json({
            success: true,
            message: "Disease image uploaded successfully",
            detection
        });

    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const uploadPestImage = async (req, res) => {
    try {
        if (!req.file) {
            throw new apiError(400, "Image is required");
        }

        const uploadedImage = await uploadDetectionImage(
            req.file.path,
            "agrisense/pest-detections"
        );

        const detection = await PestDetection.create({
            user: req.user._id,
            imageUrl: uploadedImage.secure_url,
            cloudinaryId: uploadedImage.public_id,
        });

        res.status(201).json({
            success: true,
            message: "Pest image uploaded successfully",
            detection
        });

    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const getUserDiseaseImages = async (req, res) => {
    try {
        const { userId } = req.params;
        if (String(userId) !== String(req.user._id)) {
            throw new apiError(403, "You can only view your own scans");
        }

        const detections = await DiseaseDetection
            .find({ user: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: detections.length,
            detections
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const getUserPestImages = async (req, res) => {
    try {
        const { userId } = req.params;
        if (String(userId) !== String(req.user._id)) {
            throw new apiError(403, "You can only view your own scans");
        }

        const detections = await PestDetection
            .find({ user: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: detections.length,
            detections
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const getUserDetectionImages = async (req, res) => {
    try {
        const { userId } = req.params;
        if (String(userId) !== String(req.user._id)) {
            throw new apiError(403, "You can only view your own scans");
        }

        const [diseaseDetections, pestDetections] = await Promise.all([
            DiseaseDetection.find({ user: userId }).sort({ createdAt: -1 }),
            PestDetection.find({ user: userId }).sort({ createdAt: -1 })
        ]);

        res.status(200).json({
            success: true,
            diseaseCount: diseaseDetections.length,
            pestCount: pestDetections.length,
            diseaseDetections,
            pestDetections
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const deleteDiseaseImage = async (req, res) => {
    try {
        const { detectionId } = req.params;

        const detection = await DiseaseDetection.findOne({
            _id: detectionId,
            user: req.user._id
        });

        if (!detection) {
            throw new apiError(404, "Disease detection image not found");
        }

        if (detection.cloudinaryId) {
            ensureCloudinaryConfig();
            await cloudinary.uploader.destroy(detection.cloudinaryId);
        }

        await detection.deleteOne();

        res.status(200).json({
            success: true,
            message: "Disease detection image deleted successfully"
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};

export const deletePestImage = async (req, res) => {
    try {
        const { detectionId } = req.params;

        const detection = await PestDetection.findOne({
            _id: detectionId,
            user: req.user._id
        });

        if (!detection) {
            throw new apiError(404, "Pest detection image not found");
        }

        if (detection.cloudinaryId) {
            ensureCloudinaryConfig();
            await cloudinary.uploader.destroy(detection.cloudinaryId);
        }

        await detection.deleteOne();

        res.status(200).json({
            success: true,
            message: "Pest detection image deleted successfully"
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({
            success: false,
            message: err.message
        });
    }
};