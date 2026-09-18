import express from "express";
import { sendMessage, getHistory, getConversation } from "../controllers/chat-controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";

const router = express.Router();

// Route: POST /api/chat
router.post("/", isLoggedIn, sendMessage);
// Route: GET /api/chat/history
router.get("/history", isLoggedIn, getHistory);
// Route: GET /api/chat/conversations/:id
router.get("/conversations/:id", isLoggedIn, getConversation);

export default router;
