import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Tweet } from "../models/tweet.model.js";

const uploadTweet = asyncHandler(async(req,res)=>{
    const { content } = req.body

    if(!content?.trim()){
        throw new ApiError(403,"content is required.")
    }

    const createdTweet = await Tweet.create({
        content:content,
        owner:req.user._id
    })

    if(!createdTweet){
        throw new ApiError(403,"Tweet upload failed")
    }

    res.status(200)
    .json(new ApiResponse(200,createdTweet,"Tweet created successfully"))
})

const updateTweet = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params
    const { content } = req.body

    if(!tweetId){
        throw new ApiError(401,"tweetId is invalid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(401,"tweet not found")
    }

    if (tweet.owner.toString() != req.user._id.toString()){
        throw new ApiError(401,"User is not authorized to update the tweet.")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(tweetId,
        {
            $set:{
                content:content
            }
        }
        ,{new:true})
    
    if(!updatedTweet){
        throw ApiError(403,"Tweet Updation failed")
    }

    res.status(200)
    .json(new ApiResponse(200,updatedTweet,"Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(401,"tweetId is invalid")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(401,"tweet not found")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweet._id)

    if(!deletedTweet){
        throw ApiError(403,"Tweet not found or deleted already")
    }

    res.status(200)
    .json(new ApiResponse(200,deletedTweet,"Tweet deleted successfully"))
})



export {uploadTweet, updateTweet, deleteTweet}