import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudnary, updatetoCloudnary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"; 
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req,res)=>{
    // 1) get info from frontend
    // 2) validation - not empty
    // 3) check if user exsists
    // 4) check for images & avatar
    // 5) upload images & avatar to cloudninary
    // 6) create user object create entry in db
    // 7) remove password and refreshtoken from response
    // 8) check for user creation
    // 9) return res 
    const {fullName,email,username,password} = req.body
    
    if ([fullName,email,username,password].some((field)=>field?.trim() === "")){
        throw new ApiError(400,"All Fields are required")
    }
    const existedUser = await User.findOne({
        $or:[{email},{username}]
    })

    if (existedUser){
        throw new ApiError(409,"User with email or username already exsists")
    }

    const avatarlocalPath = req.files?.avatar[0]?.path;
    
    if(!avatarlocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatarUploadRes = await uploadToCloudnary(avatarlocalPath)
    
    let coverImagelocalPath;
    let coverImageUploadRes;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){

        coverImagelocalPath = req.files.coverImage[0].path
        coverImageUploadRes = await uploadToCloudnary(coverImagelocalPath)
    }

    if(!avatarUploadRes){
        throw ApiError(400,"Avatar file upload failed")
    }

    const user = await User.create({
        fullName,
        avatar:{
            url:avatarUploadRes.url,
            public_id:avatarUploadRes.public_id
        },
        coverImage:{
            url:coverImageUploadRes?.url||"",
            public_id:coverImageUploadRes?.public_id||""
        },
        email,
        password,
        username,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(200,createdUser,"User registered successfully."))

})

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
        
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refereshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }
    try {   

        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
        
        if (incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user?._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        
        return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(new ApiResponse(200,
            {
                accessToken,
                refreshToken
            },
            "Access token refreshed."
        ))
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token")
    }

})

const updatePasswordUser = asyncHandler(async(req,res)=>{
    // req.user._id
    const { oldPassword,newPassword } = req.body
    const user = await User.findById(req.user?._id)

    const result = await user.isPasswordCorrect(oldPassword)

    if (!result){
        throw new ApiError(404,"Password is incorrect.")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    res.status(200)
    .json(new ApiResponse(200,{},"password changed successfully."))

})

const updateDetailsUser = asyncHandler(async (req,res)=>{
    const {fullName,email,username} = req.body

    if (!fullName && !email && !username){
        throw new ApiError(401,"Atleast one field shoud be there.")
    }

    const updateData = {}

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (username) updateData.username = username;


    const result = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        {new:true}
        ).select("-password -refreshToken");


    if(!result){
        throw new ApiError(401,error?.message|| "user updates failed")
    }

    res.status(200)
    .json(new ApiResponse(200,result,"data updated successfully"))

})

const updateAvatarUser = asyncHandler(async (req,res)=>{
    
    if (!req.file){
        throw new ApiError(401,"Avatar image should exsists")
    }
    
    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(403,"User not found")
    }

    const { newResponse , delResponse } = await updatetoCloudnary(req.file.path,user.avatar.public_id)

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar:{
                        url:newResponse.url,
                        public_id:newResponse.public_id
                    }
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken -watchHistory -createdAt")

    return res.status(200).json(new ApiResponse(200,updatedUser,"Avatar Image Updated successfully."))

})

const updateCoverImageUser = asyncHandler(async (req,res)=>{
    if (!req.file){
        throw new ApiError(401,"Cover image should exsists")
    }
    const user = await User.findById(req.user?._id)

    if(!user){
        throw new ApiError(403,"User not found")
    }

    let updatedUser;
    if (!req.user?.coverImage && req.file.path){
        const coverImageUploadResp = await uploadToCloudnary(req.file.path)

        updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage:{
                        url:coverImageUploadResp.url,
                        public_id:coverImageUploadResp.public_id
                    } 
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken -watchHistory -createdAt")

    }else if (req.user?.coverImage && req.file.path){

        const { newResponse , delResponse } = await updatetoCloudnary(req.file.path,user.coverImage.public_id)
        
        updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    coverImage:{
                        url:newResponse.url,
                        public_id:newResponse.public_id
                    }
                }
            },
            {
                new: true
            }
        ).select("-password -refreshToken -watchHistory -createdAt")
    }

    return res.status(200).json(new ApiResponse(200,updatedUser,"Cover image Updated successfully."))

})


const getCurrentUser = asyncHandler(async(req,res)=>{
    res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully."))
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(403,"username is invalid")
    }

    const userChannel = await User.findOne({username:username})

    if (!userChannel){
        throw new ApiError(402,"Channel does not exsists")
    }

    const channel = await User.aggregate([
        {
            $match:{username:username}
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"channelSubscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"channelSubscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size : "$channelSubscribers"
                },
                subscribedToCount:{
                    $size : "$channelSubscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{$in: [req.user?._id,"$channelSubscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }

        },
        {
            $project:{
                fullName:1,
                username:1,
                subscribersCount:1,
                subscribedToCount:1,
                isSubscribed:1,
                coverImage:1,
                avatar:1,
                email:1
            }
        }

    ])

    if (!channel?.length){
        throw new ApiError(404,"channel does not exsists.")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        [
            {
                $match:{
                    _id:new mongoose.Types.ObjectId(req.user._id)
                }
            },
            {
                $lookup:{
                    from:"videos",
                    localField:"watchHistory",
                    foreignField:"_id",
                    as:"watchHistoryDetails",
                    pipeline:[
                        {
                            $lookup:{
                                from:"users",
                                localField:"owner",
                                foreignField:"_id",
                                as:"videoOwnerDetails",
                                pipeline:
                                [
                                    {
                                        $project:{
                                            fullName:1,
                                            usernme:1,
                                            avatar:1,
                                        }
                                    },
                                    {
                                        $addFields:{
                                            videoOwnerDetails:{
                                                $first:"$videoOwnerDetails"
                                            }
                                        }

                                    }
                                    
                                ]
                            }
                        }
                    ]

                }

            }
        ]
    ])

    return res.status(200)
    .json(new ApiResponse(200,user[0].watchHistory,"Watch history fetched successfully."))

})



export {
    registerUser,
    loginUser,
    logoutUser,
    refereshAccessToken,
    updatePasswordUser,
    updateDetailsUser,
    updateAvatarUser,
    updateCoverImageUser,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory
}