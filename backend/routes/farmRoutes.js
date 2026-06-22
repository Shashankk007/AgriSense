import express from "express";

import { isLoggedIn } from "../middlewares/isLoggerIn.js";
import {
  createFarm,
  deleteFarm,
  getFarmById,
  getFarms,
} from "../controllers/farm-controller.js";

const router = express.Router();

router.post("/save-boundary", isLoggedIn, createFarm);
router.get("/", isLoggedIn, getFarms);
router.get("/:id", isLoggedIn, getFarmById);
router.delete("/:id", isLoggedIn, deleteFarm);

export default router;