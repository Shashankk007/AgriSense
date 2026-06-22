import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema(
{
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    itemName:{
        type:String,
        required:true
    },

    category:{
        type:String,
        enum:[
            "seed",
            "fertilizer",
            "pesticide",
            "equipment"
        ]
    },

    quantity:{
        type:Number,
        required:true
    },

    unit:{
        type:String,
        default:"kg"
    },

    price:Number,

    purchaseDate:Date
},
{
    timestamps:true
}
);

export default mongoose.model("Inventory",inventorySchema);