// database se baat krte hue error aa sakte hai - try catch lagao
// database hamaraa another continet mai rakha hai - asyc await lagao

// require('dotenv').config({path:'./env'}) //consistancy kharab krta hai code ki

import dotenv from "dotenv"
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import { app } from "./app.js";


dotenv.config({
    path:"./.env"
})


connectDB() //async await returns promises
.then(()=>{
    app.on("error",(error)=>{
        console.log("ERRR : ",error);
        throw error
    })
     
    app.listen(process.env.PORT || 8000);
    console.log(`Server is running at port : ${process.env.PORT}`);
})
.catch((err)=>{
    console.log("MONGODB connection failed !!! ",err);
})








// import express from "express"
// const app=express()
// ;(async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("Error : ",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`APP is listening on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("ERROR: ",error);
//         throw error
//     }
// })()