import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/apiError.js"
import { uploadToCloudnary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js" 

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

export { registerUser }