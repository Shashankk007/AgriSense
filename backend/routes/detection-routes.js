import express from "express";
import { detectDisease, getDetectionHistory , deleteDetectionRecord, detectPest, getPestHistory } from "../controllers/detection-controller.js";
import { upload } from '../middlewares/multer.js'; 
import { isLoggedIn } from "../middlewares/isLoggerIn.js"; 

const router = express.Router();

// Route: POST /api/detections/scan
// upload.array('cropImages', 5) ka matlab: Frontend max 5 images bhej sakta hai jiska key name 'cropImages' hoga
router.post("/scan", isLoggedIn, upload.array("cropImages", 5), detectDisease);
router.post("/scan-pest", isLoggedIn, upload.array("cropImages", 5), detectPest);
router.get("/history", isLoggedIn, getDetectionHistory);
router.get("/history/pest", isLoggedIn, getPestHistory);
router.delete("/records/:id", isLoggedIn, deleteDetectionRecord);
export default router;