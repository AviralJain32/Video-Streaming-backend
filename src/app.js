import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))//url mai special characters ko ecoded hote hai toh unhe sambhalta hai
app.use(express.static("public"))
app.use(cookieParser()) // browzer ke andar ki cookies ko server se set krane ke liye

//routes import
import userRouter from "./routes/user.routes.js"

//routes declaration
app.use("/api/v1/users",userRouter) //yaha app.get nhi aayega

export {app};