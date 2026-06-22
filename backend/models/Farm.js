import mongoose from "mongoose";

const farmSchema = new mongoose.Schema(
{
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    farmName:{
        type:String,
        required:true
    },

    area:{
        value:Number,
        unit:{
            type:String,
            default:"acre"
        }
    },

    soilType:String,

    irrigationType:String,

    boundary:{
        type:{
            type:String,
            enum:["Polygon"],
            default:"Polygon"
        },

        coordinates:{
            type:[[[Number]]],
            required:true
        }
    }
},
{
    timestamps:true
}
);

farmSchema.index({boundary:"2dsphere"});

export default mongoose.model("Farm",farmSchema);