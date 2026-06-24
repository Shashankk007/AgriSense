import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

let isConfigured = false;

const ensureCloudinaryConfig = () => {
    if (!isConfigured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
        isConfigured = true;
    }
};

const uploadOnCloudinary = async (
    localFilePath,
    folder = "agrisense"
) => {
    try {
        if (!localFilePath) return null;

        // Ensure cloudinary is configured before uploading
        ensureCloudinaryConfig();

        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
                folder
            }
        );

        fs.unlinkSync(localFilePath);

        return response;
    }
    catch (error) {

        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        console.error("Cloudinary Upload Error:", error.message || error);
        if (error.http_code) {
            console.error("Cloudinary HTTP Code:", error.http_code);
        }

        return null;
    }
};

export {
    cloudinary,
    ensureCloudinaryConfig,
    uploadOnCloudinary
};