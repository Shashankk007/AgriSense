import express from "express";
import { getHealth, getSatellite, getYield } from "../controllers/analytics-controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
const router = express.Router();
router.get("/health/:farmId", isLoggedIn, getHealth);
router.get("/satellite/:farmId", isLoggedIn, getSatellite);
router.get("/yield/:farmId", isLoggedIn, getYield);
export default router;
