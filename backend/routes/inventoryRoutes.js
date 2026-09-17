import express from "express";
import { addItem, getItems, updateItem, deleteItem } from "../controllers/inventory-controller.js";
import { isLoggedIn } from "../middlewares/isLoggerIn.js";
const router = express.Router();
router.post("/", isLoggedIn, addItem);
router.get("/", isLoggedIn, getItems);
router.patch("/:id", isLoggedIn, updateItem);
router.delete("/:id", isLoggedIn, deleteItem);
export default router;
