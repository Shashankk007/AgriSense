import express from "express";
import { addCrop, getCrops, updateCrop, deleteCrop } from "../controllers/crop-controller.js";
import { isLoggedIn } from "../middlewares/isLoggerIn.js";
const router = express.Router();
router.post("/", isLoggedIn, addCrop);
router.get("/:farmId", isLoggedIn, getCrops);
router.patch("/:id", isLoggedIn, updateCrop);
router.delete("/:id", isLoggedIn, deleteCrop);
export default router;
