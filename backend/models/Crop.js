import mongoose from "mongoose";

const cropSchema = new mongoose.Schema(
{
    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm",
        required:true
    },

    cropName:{
        type:String,
        required:true
    },

    variety:String,

    season:String,

    sowingDate:Date,

    expectedHarvestDate:Date,

    status:{
        type:String,
        enum:["active","harvested"],
        default:"active"
    }
},
{
    timestamps:true
}
);

export default mongoose.model("Crop",cropSchema);