import express from "express";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";

import { User } from "../models/User.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getUser,
  changePassword,
  changeProfileImage,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controllers/user-controller.js";
import { isLoggedIn } from "../middlewares/isLoggedIn.js";
import { upload } from "../middlewares/multer.js";
import wrapAsync from "../utils/wrapAsync.js";
import apiError from "../utils/apiError.js";

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
}

async function createUniqueUsername(baseUsername) {
  let username = baseUsername;
  let suffix = 0;

  while (await User.findOne({ username })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  return username;
}

router.post("/login", loginUser);
router.post("/register", registerUser);

router.post(
  "/google-login",
  wrapAsync(async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
      throw new apiError(400, "Google credential is required");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      throw new apiError(400, "Google account email is required");
    }

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      const emailPrefix = payload.email.split("@")[0] || "user";
      const cleanName = (payload.name || emailPrefix)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "")
        .slice(0, 20);
      const username = await createUniqueUsername(cleanName || `user${payload.sub.slice(-6)}`);

      user = await User.create({
        username,
        password: crypto.randomBytes(32).toString("hex"),
        email: payload.email,
        profileImage: payload.picture || undefined,
      });
    }

    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    user.refreshToken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return res
      .status(200)
      .cookie("accesstoken", accesstoken, buildCookieOptions())
      .cookie("refreshtoken", refreshtoken, buildCookieOptions())
      .json({
        success: true,
        message: "Google login successful",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profileImage: user.profileImage,
          phone: user.phone || '',
          address: user.address || '',
        },
      });
  }),
);

router.post("/refresh-token", refreshAccessToken);
router.post("/logout", isLoggedIn, logoutUser);
router.get("/me", isLoggedIn, getUser);

// Password Reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Profile management routes
router.patch("/me", isLoggedIn, updateProfile);
router.post("/change-password", isLoggedIn, changePassword);
router.patch("/profile-image", isLoggedIn, upload.single("profileImage"), changeProfileImage);

export default router;