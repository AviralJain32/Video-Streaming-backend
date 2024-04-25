import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinay } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Jwt from "jsonwebtoken";
const generateAcessAndRefreshTokens=async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()

        user.refreshToken=refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500,"Something went wrong while generating acess and refresh token")
    }


}

const registerUser=asyncHandler(async(req,res)=>{
    // get user details from frontend
    // validation - not empty
    // check if user already exist : username, email
    // check for images, check for avatar
    // upload them to cloudinary avatar
    // create user object - create entry in db
    // remove password and refreshtoken field from response
    // check for user creation
    // return response

    const {fullname,email,username,password}=req.body
    console.table(req.body);
    console.log(fullname,email,username,password);

    if([fullname,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields is required")
    }

    const existedUser=await User.findOne({
        $or:[{username},{email}]
    })
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path;
    // const coverImageLocalPath=req.files?.coverImage[0]?.path
    console.log(req.files); //provided by multer
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinay(avatarLocalPath)
    const coverImage=await uploadOnCloudinay(coverImageLocalPath)
    console.log(avatar);
    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
    })
    const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Somthing went wrong while registering a user")
    }

    return res.status(201).json(
         new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser=asyncHandler(async(req,res)=>{
    // Login Todos
    // req body se data le aao
    // username or email based access
    // find the user
    // password check krao
    // access and refresh token dono user ko bhejo
    // send secure cookies
    
    const {email,username,password}=req.body

    if(!username && !email){
        throw new ApiError(400,"username or email is required")
    }

    const user=await User.findOne({
        $or:[{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"user does not exists")
    }

    const isPasswordvalid=await user.isPasswordCorrect(password)
    
    if(!isPasswordvalid){
        throw new ApiError(401,"Invalid User credentials")
    }

    const {accessToken,refreshToken}=await generateAcessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
        httpOnly:true,
        secure:true
    } //by doing this option these cookies are only modifybale from server not from client side

    return res
    .status(200)
    .cookie("accessToken",accessToken,options) // .cookie cookie pqrser se aaya hai
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loggedInUser,accessToken,refreshToken
        },
        "user logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))
})

//refreshtoken aur accesstoken ki kahani
// refresh token long lived hota hai access token short lived hota hai and
// user ko baar baar login na krna pade isiliye ham jab bhi frontend se 404 error aata hai toh database mai check krva lete hai ki refresh token hai ki nhi aur usse nya access token banwa lete hai

const refreshAcessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken //or wali condition mobile applications ke liye hai

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken=Jwt.verify(incomingRefreshToken,process.env.ACCESS_TOKEN_SECRET)
        const user=User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        } 
        const {accessToken,newRefreshToken}=await generateAcessAndRefreshTokens(user._id)
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid Refresh Token")
    }
})

const changeCurrentUserPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400,"Inavlid Old Password")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})

    return res.status(200)
    .json(new ApiResponse(200,{},"password Changed Successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200,req.user,"current user fetched successfully"))
})

const updateAccuntDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body

    if(!fullname && !email){
        throw new ApiError(400,"All fields are required")
    }
    
    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
           $set:{
            fullname:fullname,
            email:email
           } 
        },
        {new:true}
        ).select("-password")

        return res.status(200)
        .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image file is missing")
    }
    const coverImage=await uploadOnCloudinay(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading on cloud")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing")
    }
    const avatar=await uploadOnCloudinay(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Error while uploading on avatar")
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image updated successfully")
    )

    //TODO: delete old image - assignment
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }
    //value jo aati hai aggregation pipeline likhne ke baad vo arrays aati hai
    const channel=await User.aggregate([{
        $match:{
            username:username?.toLowerCase()
        }
    },
    {
        $lookup:{
            from:"subscriptions",
            foreignField:"channel",
            localField:"_id",
            as:"subscribers"
        }
    },{
        $lookup:{
            from:"subscriptions",
            foreignField:"subscriber",
            localField:"_id",
            as:"subscribedTo"
        }
    },{
        $addFields:{
            subscribersCount:{
                $size:"$subscribers"
            },
            channelsSubscribedToCount:{
                $size:"$subscribedTo"
            },
            isSubscribed:{
                if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                then:true,
                else:false
            }
        }
    },{
        $project:{
            fullname:1,
            username:1,
            subscribersCount:1,
            channelsSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
        }
    }
    ])
    if(!channel?.length){
        throw new ApiError(404,"channel does not exist")
    }
    console.log(channel);
    return res.status(200)
    .json(new ApiResponse(200,channel[0],"User channel fetched sucessfully"))
})


export {registerUser,loginUser,logoutUser,refreshAcessToken,getCurrentUser,changeCurrentUserPassword,updateAccuntDetails
,updateUserAvatar,updateUserCoverImage,
getUserChannelProfile}