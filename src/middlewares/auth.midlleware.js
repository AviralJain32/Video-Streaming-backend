import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import {User} from "../models/user.model.js"
export const verifyJWT=asyncHandler(async(req,_,next)=>{
    try {
        //token ka access -> cookie ka acess
        const token=req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") //yaha requiest.cookies hi aayega not cookie
    
        if(!token){
            throw new ApiError(401,"Unauthorized request")
        }
    
        const decodedInfoToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
        const user=await User.findById(decodedInfoToken?._id).select("-password -refreshToken")
    
        if(!user){
            //todo
            throw new ApiError(401,"Invalid Acess Token")
        }
        req.user=user; //main step of middleware
        next()
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Access Token")
    }
})