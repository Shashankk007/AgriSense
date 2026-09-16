import wrapAsync from "../utils/wrapAsync.js";
import {User} from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import apiError from "../utils/apiError.js";
import uploadProfileImage from "../utils/uploadProfileImage.js";

const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
};


const registerUser = wrapAsync(async (req, res) => {
    

    const { username, email, password, profileImage } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
        throw new apiError(400, "All fields are required")
    }


    // Check if user already exists
    const existingUser = await User.findOne({ $or: [ { username }, { email }] });
    if (existingUser) {
        throw new apiError(409, "User already exists");
    }


    // Upload profileImage if provided
    const profileImageLocalPath = req.file?.path;

    let profileImageUrl = "";
    if (profileImageLocalPath) {
        try {
            profileImageUrl = await uploadProfileImage(profileImageLocalPath);
        } catch (error) {
            throw new apiError(500, "profileImage upload failed", error);
        }
    }

    // Create and save the user
    const newUser = await User.create({
        username,
        password,
        email,
        profileImage: profileImageUrl
    });

    // Generate tokens and set cookies so user is auto-logged-in after signup
    const accesstoken = newUser.generateAccessToken();
    const refreshtoken = newUser.generateRefreshToken();
    newUser.refreshToken = refreshtoken;
    await newUser.save({ validateBeforeSave: false });

    // Remove sensitive fields from response
    const userResponse = {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
    };

    res
        .status(201)
        .cookie("accesstoken", accesstoken, authCookieOptions)
        .cookie("refreshtoken", refreshtoken, authCookieOptions)
        .json(userResponse);
});


const loginUser = wrapAsync(async (req, res) => {
    const {username,email,password} = req.body;
    // console.log("req.body:", req.body);
    if (!(username || email)) {
        throw new apiError(400, "Username or Email is required")
    }

    if (!password) {
        throw new apiError(400, "Password is required")
    }


    const user = await User.findOne({ $or: [ { username }, { email }] });
    if (!user) {
        throw new apiError(401, "User does not exist");
    }

    const validpass = await user.matchPassword(password);
    if(!validpass){
        throw new apiError(401, "Invalid password");
    }

    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    user.refreshToken = refreshtoken;       //save the refresh token in the database so that user can be logged in again
    await user.save({ validateBeforeSave: false }); //skip validation
    

    return res
        .status(200)
        .cookie('accesstoken', accesstoken, authCookieOptions)
        .cookie('refreshtoken', refreshtoken, authCookieOptions)
        .json({ message: "User logged in successfully" });
});



const logoutUser = wrapAsync(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: "" // this removes the field from document
            }
        },
        {
            new: true // returns the updated document
        }
    )

    return res
    .status(200)
    .clearCookie("accesstoken", authCookieOptions)
    .clearCookie("refreshtoken", authCookieOptions)
    .json("User logged Out successfully")
})


const refreshAccessToken = wrapAsync(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken

    if (!incomingRefreshToken) {
        throw new apiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?.id)
    
        if (!user) {
            throw new apiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(401, "Refresh token is expired or used")
            
        }
    
        const accesstoken = user.generateAccessToken();
        const newRefreshtoken = user.generateRefreshToken();
        user.refreshToken = newRefreshtoken; // save the new refresh token in the database
        await user.save({ validateBeforeSave: false }); 
    
        return res
        .status(200)
        .cookie("accesstoken", accesstoken, authCookieOptions)
        .cookie("refreshtoken", newRefreshtoken, authCookieOptions)
        .json({ message: "Access token refreshed"})

    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }

})

const changePassword = wrapAsync(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // Validate required fields
    if (!oldPassword || !newPassword) {
        throw new apiError(400, "All fields are required")
    }

    // Check if the old password is correct
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) {
        throw new apiError(401, "Old password is incorrect");
    }

    // Update the password
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Password changed successfully" });
})

const changeProfileImage = wrapAsync(async (req, res) => {
    const profileImageLocalPath = req.file?.path;

    if(!profileImageLocalPath){
        throw new apiError(400, "Avatar is required")
    }

    //deleting old avatar first
    const user = await User.findById(req.user.id).select("-password");
    const userProfileImage = user.profileImage;
    if(userProfileImage){
        const publicId = userProfileImage.split('/').pop().split('.')[0]; // Extract public ID from URL
        await cloudinary.uploader.destroy(`agrisense/profile-images/${publicId}`); // Delete old  from Cloudinary
    }

    // Upload new avatar to Cloudinary
    const newUrl = await uploadProfileImage(profileImageLocalPath);
    if (!newUrl) {
        throw new apiError(500, "Profile image upload failed")
    }

    // Update user's avatar URL in the database
    user.profileImage = newUrl;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json({
        message: "Profile image updated successfully",
        user,
    })
    
})

const getUser = wrapAsync(async(req, res) => {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
        throw new apiError(404, "User not found");
    }
    res.status(200).json(user);
})


const updateProfile = wrapAsync(async (req, res) => {
    const { username, phone, address } = req.body;

    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
        throw new apiError(404, "User not found");
    }

    // If username is being changed, ensure it's not already taken
    if (username && username !== user.username) {
        const existing = await User.findOne({ username });
        if (existing) {
            throw new apiError(409, "Username is already taken");
        }
        user.username = username;
    }

    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
        message: "Profile updated successfully",
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            profileImage: user.profileImage,
            phone: user.phone,
            address: user.address,
        },
    });
});

export { registerUser, loginUser, logoutUser, changePassword, changeProfileImage, refreshAccessToken, getUser, updateProfile };
