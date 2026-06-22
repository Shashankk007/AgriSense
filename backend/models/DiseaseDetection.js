import mongoose from "mongoose";

const diseaseDetectionSchema = new mongoose.Schema(
{
    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm"
    },

    cropId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Crop"
    },

    imageUrl:{
        type:String,
        required:true
    },

    crop:String,

    disease:String,

    confidence:Number,

    severity:{
        type:String,
        enum:["Low","Medium","High"]
    },

    diseaseType:String,

    affectedPart:String,

    cause:String,

    solution:String,

    detectedAt:{
        type:Date,
        default:Date.now
    }
},
{
    timestamps:true
}
);

export default mongoose.model("DiseaseDetection",diseaseDetectionSchema);