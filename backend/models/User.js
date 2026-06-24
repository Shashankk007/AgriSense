import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true, // Aage-peeche ke extra spaces hata dega
    },

    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"], // Sirf 10 digit allow karega
    },
    email: {
            type: String,
            required: false, // Optional kar diya
            unique: true, 
            sparse: true, // 🚨 MAGIC KEYWORD: Agar email nahi hai, toh duplicate error nahi dega
            lowercase: true,
            trim: true,
        },
    password: {
      type: String,
      required: true, // Frontend par farmer ko bolna ki 4-digit PIN dale (e.g., 1234)
    },

    language: {
      type: String,
      enum: ["hi", "en", "mr", "pa", "ta", "te"], // Hindi, English, Marathi, Punjabi, Tamil, Telugu
      default: "hi", // Default Hindi rakha hai
    },

    profileImage: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/1326/1326382.png",
    },

    role: {
      type: String,
      enum: ["farmer", "admin", "expert"],
      default: "farmer",
    },

    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Password hashing before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

// Compare password/PIN
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate Access Token (Email hata kar phoneNumber add kiya hai)
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      fullName: this.fullName,
      phoneNumber: this.phoneNumber,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);