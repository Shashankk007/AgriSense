import express from "express";

import {
    uploadDiseaseImage,
    uploadPestImage,
    getUserDiseaseImages,
    getUserPestImages,
    getUserDetectionImages,
    deleteDiseaseImage,
    deletePestImage
} from "../controllers/detection-controller.js";

import { isLoggedIn } from "../middlewares/isLoggerIn.js";
import { upload } from "../middlewares/multer.js";

const router = express.Router();

router.post(
    "/disease/upload",
    isLoggedIn,
    upload.single("image"),
    uploadDiseaseImage
);

router.post(
    "/pest/upload",
    isLoggedIn,
    upload.single("image"),
    uploadPestImage
);

router.get(
    "/user/:userId",
    isLoggedIn,
    getUserDetectionImages
);

router.get(
    "/user/:userId/disease",
    isLoggedIn,
    getUserDiseaseImages
);

router.get(
    "/user/:userId/pest",
    isLoggedIn,
    getUserPestImages
);

router.delete(
    "/disease/:detectionId",
    isLoggedIn,
    deleteDiseaseImage
);

router.delete(
    "/pest/:detectionId",
    isLoggedIn,
    deletePestImage
);

export default router;