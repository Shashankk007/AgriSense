import { uploadOnCloudinary } from "./cloudinary.js";

const uploadPhoto = async (
    localPath,
    folder = "agrisense/photos"
) => {

    if (!localPath) {
        throw new Error("Image path missing");
    }

    const image = await uploadOnCloudinary(
        localPath,
        folder
    );

    if (!image) {
        throw new Error("Image upload failed");
    }

    return {
        public_id: image.public_id,
        url: image.secure_url
    };
};

export default uploadPhoto;