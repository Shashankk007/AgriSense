import axios from "axios";
import wrapAsync from "../utils/wrapAsync.js";
import apiError from "../utils/apiError.js";

// The ML service only accepts chat calls carrying the shared secret (server-to-server), so the
// browser never talks to it directly and user_id always comes from the verified session.
// Read at call time: .env is loaded after ES module imports are evaluated.
const mlUrl = () => process.env.FAST_API_URL || "http://localhost:8000";
const mlHeaders = () => ({ "X-Admin-Key": process.env.ML_ADMIN_KEY || "" });

// Keep meaningful 4xx answers from the ML service; everything else is surfaced as a 502.
const mlError = (err) => {
    const status = err.response?.status;
    const detail = err.response?.data?.detail;
    if (status >= 400 && status < 500 && status !== 401 && status !== 403) {
        return new apiError(status, detail || "Chat request rejected");
    }
    console.error("ML chat error:", err.response?.data || err.message);
    return new apiError(502, "The AI assistant is unavailable right now. Please try again later.");
};

export const sendMessage = wrapAsync(async (req, res) => {
    const { message, conversation_id } = req.body;
    if (typeof message !== "string" || !message.trim()) {
        throw new apiError(400, "message is required");
    }
    const payload = { user_id: String(req.user._id), message: message.trim() };
    if (conversation_id) payload.conversation_id = String(conversation_id);

    try {
        const { data } = await axios.post(`${mlUrl()}/chat`, payload, { headers: mlHeaders(), timeout: 90000 });
        res.status(200).json(data);
    } catch (err) {
        throw mlError(err);
    }
});

export const getHistory = wrapAsync(async (req, res) => {
    try {
        const { data } = await axios.get(`${mlUrl()}/chat/history/${encodeURIComponent(String(req.user._id))}`, {
            headers: mlHeaders(),
            timeout: 15000,
        });
        res.status(200).json(data);
    } catch (err) {
        throw mlError(err);
    }
});

export const getConversation = wrapAsync(async (req, res) => {
    try {
        const { data } = await axios.get(`${mlUrl()}/chat/conversation/${encodeURIComponent(req.params.id)}`, {
            headers: mlHeaders(),
            params: { user_id: String(req.user._id) },
            timeout: 15000,
        });
        res.status(200).json(data);
    } catch (err) {
        throw mlError(err);
    }
});
