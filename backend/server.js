import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import farmRoutes from "./routes/farmRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import detectionRoutes from "./routes/detection-routes.js";
import cropRoutes from "./routes/cropRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { connectDb } from "./utils/db.js";
import apiError from "./utils/apiError.js";
dotenv.config();

const app = express();

// Connect to database
connectDb();

// Middlewares
app.use(helmet());
app.use(
	cors({
		origin: process.env.CLIENT_URL || true,
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/farms", farmRoutes);
app.use("/api/detections", detectionRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/chat", chatRoutes);

// Handle unknown routes (use middleware to avoid path token parsing issues)
app.use((req, res, next) => {
	next(new apiError(404, `Can't find ${req.originalUrl} on this server`));
});

// Global error handler
app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	const status = err.status || "error";
	
	console.error("🔥 Global Error Handler Caught:", err);

	res.status(statusCode).json({
		status,
		message: err.message || "Internal Server Error",
		errors: err.errors || undefined,
	});
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

export default app;

