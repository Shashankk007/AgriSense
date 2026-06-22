import mongoose from "mongoose";

const pestDetectionSchema = new mongoose.Schema(
{
    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm"
    },

    imageUrl:{
        type:String,
        required:true
    },

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