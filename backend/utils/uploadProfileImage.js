import { uploadOnCloudinary } from "./cloudinary.js";

const uploadProfileImage = async (localFilePath) => {
    if (!localFilePath) {
        throw new Error("Profile image is required");
    }

    const avatar = await uploadOnCloudinary(
        localFilePath,
        "agrisense/profile-images"
    );

    if (!avatar) {
        throw new Error("Failed to upload profile image");
    }

    return {
        public_id: avatar.public_id,
        url: avatar.secure_url
    };
};

export default uploadProfileImage;