import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadToCloudnary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"; 

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
    
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        console.log("from generateAccessAndRefreshTokens accessToken : ",accessToken,"\n");
        console.log("from generateAccessAndRefreshTokens refreshToken : ",refreshToken);

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
        throw ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullName,
        avatar:avatarUploadRes.url,
        coverImage:coverImageUploadRes?.url||"",
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



export {
    registerUser,
    loginUser,
    logoutUser,
    refereshAccessToken
}