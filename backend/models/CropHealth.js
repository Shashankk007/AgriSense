import mongoose from "mongoose";

const cropHealthSchema = new mongoose.Schema(
{
    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm",
        required:true
    },

    userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"User",
            required:true
        },
    
    cropId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Crop",
        required:true
    },

    date:{
        type:Date,
        required:true
    },

    healthScore:{
        type:Number
    },

    healthStatus:{
        type:String,
        enum:["Good","Moderate","Poor"]
    },

    ndvi:Number,

    recommendations:[
        String
    ]
},
{
    timestamps:true
}
);

export default mongoose.model("CropHealth",cropHealthSchema);