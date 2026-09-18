import mongoose from "mongoose";

// 🟢 SUB-SCHEMA: Har ek image ka apna personal record aur ML result
const imageResultSchema = new mongoose.Schema({
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true }, // Delete karne ke liye

    prediction: {
        diseaseName: { type: String, default: "Pending" },
        confidenceScore: { type: Number, default: null },
        isHealthy: { type: Boolean, default: false },

        // 🟢 DOST KE AWESOME ADDITIONS:
        severity: { 
            type: String, 
            enum: ["Low", "Medium", "High", "None"], 
            default: "None" 
        },
        diseaseType: { type: String, default: "Unknown" },
        affectedPart: { type: String, default: "Leaf" },
        cause: { type: String }
    },

    // Dost ka "solution" humne arrays mein convert kar diya taaki bullet points ban sakein
    precautions: [{ type: String }],
    treatments: [{ type: String }]
}, { _id: true });


// 🟢 MAIN SCHEMA: Poore scan session ka master record
const detectionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    
    // 🟢 DOST KI SMART RELATIONSHIPS (Optional rakhi hain taaki error na aaye)
    farmId: { type: mongoose.Schema.Types.ObjectId, ref: "Farm" },
    cropId: { type: mongoose.Schema.Types.ObjectId, ref: "Crop" },
    
    cropType: { type: String, default: "Unknown" }, // e.g., Tomato, Potato

    images: [imageResultSchema], // Yahan 3-5 images ek sath aayengi!

    status: {
        type: String,
        enum: ["uploading", "processing", "completed", "failed"],
        default: "uploading"
    },
    totalImagesScanned: { type: Number, default: 0 },
    diseasesFoundSummary: [{ type: String }] // History page ke liye quick tags

}, { timestamps: true }); // 'timestamps' automatically 'createdAt' date de dega

export const Detection = mongoose.model("Detection", detectionSchema);