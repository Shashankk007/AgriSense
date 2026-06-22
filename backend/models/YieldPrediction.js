import mongoose from "mongoose";

const yieldPredictionSchema = new mongoose.Schema(
{
    farmId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Farm",
        required:true
    },

    cropId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Crop",
        required:true
    },

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    
    predictionDate:{
        type:Date,
        default:Date.now
    },

    predictedYield:{
        type:Number,
        required:true
    },

    unit:{
        type:String,
        default:"ton/hectare"
    },

    confidence:Number,

    featuresUsed:{
        ndvi:Number,
        rainfall:Number,
        temperature:Number,
        soilMoisture:Number,
        lst:Number
    }
},
{
    timestamps:true
}
);

export default mongoose.model("YieldPrediction",yieldPredictionSchema);