import { uploadOnCloudinary } from "./cloudinary.js";

const uploadProfileImage = async (req) => {

    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new Error("Profile image is required");
    }

    const avatar = await uploadOnCloudinary(
        avatarLocalPath,
        "agrisense/profile-images"
    );

    if (!avatar) {
        throw new Error("Failed to upload profile image");
    }

    return avatar.secure_url;
};

export default uploadProfileImage;