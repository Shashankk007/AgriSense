import mongoose from "mongoose";

const pestDetectionSchema = new mongoose.Schema(
{
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm"
    },

    imageUrl:{
        type:String,
        required:true
    },

    cloudinaryId: String,


    pestName:String,

    confidence:Number,

    severity:{
        type:String,
        enum:["Low","Medium","High"]
    },

    recommendation:String,

    detectedAt:{
        type:Date,
        default:Date.now
    }
},
{
    timestamps:true
}
);

export default mongoose.model("PestDetection",pestDetectionSchema);
