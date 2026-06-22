import mongoose from "mongoose";

const satelliteDataSchema = new mongoose.Schema(
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

    ndvi:Number,
    evi:Number,

    rainfall:Number,

    temperature:Number,

    soilMoisture:Number,

    lst:Number,

    source:{
        type:String,
        default:"Google Earth Engine"
    }
},
{
    timestamps:true
}
);

export default mongoose.model("SatelliteData",satelliteDataSchema);