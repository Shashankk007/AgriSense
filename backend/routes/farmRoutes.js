import express from "express";

import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import {
  createFarm,
  deleteFarm,
  getFarmById,
  getFarmNdvi,
  getFarms,
} from "../controllers/farm-controller.js";

const router = express.Router();

router.post("/save-boundary", isLoggedIn, createFarm);
router.get("/", isLoggedIn, getFarms);
router.get("/:id", isLoggedIn, getFarmById);
router.get("/:id/ndvi", isLoggedIn, getFarmNdvi);
router.delete("/:id", isLoggedIn, deleteFarm);

export default router;