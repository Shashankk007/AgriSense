import wrapAsync from "../utils/wrapAsync.js";
import {User} from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import uploadProfileImage from "../utils/uploadProfileImage.js";
import { cloudinary,ensureCloudinaryConfig  } from "../utils/cloudinary.js";
import apiError from "../utils/apiError.js";

const authCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
};

// 🟢 REGISTER CONTROLLER
const registerUser = wrapAsync(async (req, res) => {
    const { fullName, phoneNumber, email, password, profileImage } = req.body;

    // 1. Validate only compulsory fields
    if (!fullName || !phoneNumber || !password) {
        throw new apiError(400, "Full Name, Phone Number, and Password (PIN) are required");
    }

    // 2. Check if user already exists
    // Database mein Phone number hamesha check hoga. Email tabhi check hoga agar aaya hai.
    let searchQuery = [{ phoneNumber }];
    if (email && email.trim() !== "") {
        searchQuery.push({ email });
    }

    const existingUser = await User.findOne({ $or: searchQuery });
    if (existingUser) {
        throw new apiError(409, "User with this Phone Number (or Email) already exists");
    }

    // 3. Upload Profile Image (Same logic)
    const profileImageLocalPath = req.file?.path;
    let profileImageUrl = "https://cdn-icons-png.flaticon.com/512/1326/1326382.png"; // Default
    
    if (profileImageLocalPath) {
        try {
            profileImageUrl = await uploadProfileImage(profileImageLocalPath);
        } catch (error) {
            throw new apiError(500, "Profile image upload failed", error);
        }
    }

    // 4. Create User
    const newUser = await User.create({
        fullName,
        phoneNumber,
        password,
        // Agar email frontend se khali nahi aaya, toh usko save karo, warna 'undefined' chhod do
        email: email && email.trim() !== "" ? email : undefined,
        profileImage: profileImageUrl
    });

    // 5. Generate Tokens
    const accesstoken = newUser.generateAccessToken();
    const refreshtoken = newUser.generateRefreshToken();
    newUser.refreshToken = refreshtoken;
    await newUser.save({ validateBeforeSave: false });

    // 6. Send Response
    const userResponse = {
        id: newUser._id,
        fullName: newUser.fullName,
        phoneNumber: newUser.phoneNumber,
        email: newUser.email,
        profileImage: newUser.profileImage,
    };

    res.status(201)
       .cookie("accesstoken", accesstoken, authCookieOptions)
       .cookie("refreshtoken", refreshtoken, authCookieOptions)
       .json(userResponse);
});

// 🟢 LOGIN CONTROLLER
const loginUser = wrapAsync(async (req, res) => {
    // 1. Sirf phoneNumber aur password extract karo
    const { phoneNumber, password } = req.body;
    
    if (!phoneNumber || !password) {
        throw new apiError(400, "Phone Number and Password (PIN) are required for login");
    }

    // 2. Database mein strictly sirf Phone Number se search karo
    const user = await User.findOne({ phoneNumber });
    if (!user) {
        throw new apiError(401, "No account found with this Phone Number");
    }

    // 3. Match the PIN/Password
    const validpass = await user.matchPassword(password);
    if (!validpass) {
        throw new apiError(401, "Invalid PIN/Password");
    }

    // 4. Generate Tokens
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    user.refreshToken = refreshtoken;      
    await user.save({ validateBeforeSave: false }); 
    
    // 5. Send Response
    return res.status(200)
              .cookie('accesstoken', accesstoken, authCookieOptions)
              .cookie('refreshtoken', refreshtoken, authCookieOptions)
              .json({ 
                  message: "User logged in successfully",
                  user: {
                      id: user._id,
                      fullName: user.fullName,
                      phoneNumber: user.phoneNumber,
                      email: user.email,
                      profileImage: user.profileImage
                  }
              });
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

const changePin = wrapAsync(async (req, res) => {
    const { oldPin, newPin } = req.body;
    const userId = req.user.id; // isLoggedIn middleware se aayega

    if (!oldPin || !newPin) {
        throw new apiError(400, "Both Old PIN and New PIN are required");
    }

    if (newPin.length !== 4) {
        throw new apiError(400, "New PIN must be exactly 4 digits");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new apiError(404, "User not found");
    }

    // 1. Purana PIN match karo
    const isMatch = await user.matchPassword(oldPin);
    if (!isMatch) {
        throw new apiError(401, "Incorrect Old PIN");
    }

    // 2. Naya PIN set karo (Mongoose ka pre-save hook isko khud hash/encrypt kar dega)
    user.password = newPin;
    await user.save();

    res.status(200).json({
        success: true,
        message: "PIN changed successfully! 🌱"
    });
});

const changeProfileImage = wrapAsync(async (req, res) => {
     ensureCloudinaryConfig();  
    const profileImageLocalPath = req.file?.path;
    const defaultImageUrl = req.body.defaultImage; // Naya frontend yeh bhi bhejta hai

    // Agar dono nahi hain, tab error do
    if(!profileImageLocalPath && !defaultImageUrl){
        throw new apiError(400, "Please provide an image file or choose to remove it");
    }

    const user = await User.findById(req.user.id).select("-password");
    const userProfileImage = user.profileImage;

    // Dost ka likha hua 'Old Avatar Delete' logic (Ekdum perfect hai)
    if(userProfileImage && userProfileImage.includes("cloudinary.com")){
        const pathSegments = new URL(userProfileImage).pathname.split("/");
        const uploadIndex = pathSegments.findIndex((segment) => segment === "upload");
        const publicIdWithExtension = pathSegments.slice(uploadIndex + 2).join("/");
        const publicId = publicIdWithExtension.replace(/\.[^/.]+$/, "");

        if (publicId) {
            // Yahan API Key zaroori hai, warna server crash hoga
            await cloudinary.uploader.destroy(publicId);
        }
    }

    let finalImageUrl = user.profileImage;

    // Agar user ne nayi photo bheji hai
    if (profileImageLocalPath) {
        const uploadedProfileImage = await uploadProfileImage(profileImageLocalPath);
        
        // Utility file jo url return kar rahi hai, uske hisaab se format check karein
        const newUrl = uploadedProfileImage?.url || uploadedProfileImage; 
        
        if (!newUrl) {
            throw new apiError(500, "Profile image upload failed");
        }
        finalImageUrl = newUrl;
    } 
    // Agar user ne 'Remove' button dabaya hai
    else if (defaultImageUrl) {
        finalImageUrl = defaultImageUrl;
    }

    // Database update karo
    user.profileImage = finalImageUrl;
    await user.save({ validateBeforeSave: false });

    // 🟢 FRONTEND KO YEH RESPONSE CHAHIYE HOTA HAI
    return res.status(200).json({
        success: true, // Yeh add karna bohot zaroori tha Toast chalane ke liye!
        message: "Profile image updated successfully",
        profileImage: finalImageUrl, 
    });
});

const getUser = wrapAsync(async(req, res) => {
    const user = await User.findById(req.user.id).select("-password -refreshToken");
    if (!user) {
        throw new apiError(404, "User not found");
    }
   res.status(200).json({
        id: user._id,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        profileImage: user.profileImage
    });
})

// 🟢 update profile
const updateProfile = wrapAsync(async (req, res) => {
    const { fullName, email } = req.body;
    const userId = req.user.id;

    if (!fullName) {
        throw new apiError(400, "Full Name is required");
    }

    // 1. Ek smart Update Object banate hain
    let updateQuery = { 
        $set: { fullName: fullName } 
    };

    // 2. Email ka solid logic
    if (email && email.trim() !== "") {
        // Check karo ki email kisi aur farmer ne toh nahi li
        const existingEmail = await User.findOne({ email: email.trim(), _id: { $ne: userId } });
        if (existingEmail) {
            throw new apiError(400, "This email is already registered to another farmer.");
        }
        // Agar sab theek hai, toh email ko $set mein daal do
        updateQuery.$set.email = email.trim().toLowerCase();
    } else {
        // 🟢 MAGIC: Agar user dabbe ko khali chhod deta hai, toh DB se email field ko uda do ($unset)
        updateQuery.$unset = { email: 1 };
    }

    // 3. Direct Force Update (findByIdAndUpdate use karke)
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateQuery,
        { new: true, runValidators: false } // 'new: true' humesha naya data return karta hai
    );

    if (!updatedUser) {
        throw new apiError(404, "User not found");
    }

    // 4. Frontend ko updated data bhej do
    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: {
            id: updatedUser._id,
            fullName: updatedUser.fullName,
            phoneNumber: updatedUser.phoneNumber,
            email: updatedUser.email,
            profileImage: updatedUser.profileImage
        }
    });
});
    

export { registerUser, loginUser, logoutUser , changePin, changeProfileImage, refreshAccessToken, getUser,updateProfile};
