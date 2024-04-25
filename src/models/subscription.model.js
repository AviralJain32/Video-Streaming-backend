import mongoose,{Schema, model} from "mongoose";

const SubscriptionSchema=new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, //one who is subsribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, //one who is channel owner
        ref:"User"
    }
},{timestamps:true})

export const Subcription=mongoose.Model("Subscription",SubscriptionSchema)