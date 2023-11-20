import mongoose from "mongoose";

const schema=new mongoose.Schema({
    title:{
        type:String,
        required:[true,"Enter Title"],
    },
    description:{
        type:String,
        required:[true,"Enter Description"],
    },
    resources:{
        title:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        docFile:{
            public_id:{
                type:String,
                required:true,
            },
            url:{
                type:String,
                required:true,
            }
        },
    },
    
    poster:{
        public_id:{
            type:String,
            required:true,
        },
        url:{
            type:String,
            required:true,
        }
    },
    views:{
        type:Number,
        default:0,
    },
    numOfdocFile:{
        type:Number,
        default:0,
    },
    createdBy:{
        type:String,
        required:[true,"Enter Creator Name"]
    }
})

export const Project=mongoose.model("Project",schema)