import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import { Tweet } from "../models/tweet.model.js"


const getLikedVideos = asyncHandler(async (req, res) => {
    const likeAggregate = await Like.aggregate(
        [
            {
              $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),//ObjectId("6751bc8191cc59810b5c71d7"),
                video: {
                  $exists: true,
                },
              },
            },
            {
              $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos",
                pipeline: [
                  {
                    $project: {
                      description: 1,
                      title: 1,
                      "videoFile.url": 1,
                      "thumbnail.url": 1,
                      owner: 1,
                      views: 1,
                      duration: 1,
                      createdAt: 1,
                    },
                  },
                  {
                    $lookup: {
                      from: "users",
                      localField: "owner",
                      foreignField: "_id",
                      as: "videoOwnerDetails",
                      pipeline: [
                        {
                          $project: {
                            fullName: 1,
                            username: 1,
                            "avatar.url": 1,
                          },
                        },
                      ],
                    },
                  },
                  {
                    $addFields: {
                      videoOwnerDetails: {
                        $first: "$videoOwnerDetails",
                      },
                    },
                  },
                ],
              },
            },
            {
              $unwind: {
                path: "$likedVideos",
              },
            },
            {
              $sort: {
                createdAt: -1,
              },
            },
          ]
    
    )
    return res.status(200)
    .json(new ApiResponse(200,likeAggregate,"liked videos fetched successfully"))
})


const toggleVideoLike = asyncHandler(async(req,res)=>{
    const { videoId } = req.params

    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(402,"Video not found")

    }

    const videoLikedAlready = await Like.findOne(
        {
            video:videoId,
            likedBy:req.user?._id
        })
    
    if(videoLikedAlready){
        const deletedVideoLike = await Like.findByIdAndDelete(videoLikedAlready._id)

        if(!deletedVideoLike){
            throw new ApiError(404,"Video like not found or already deleted")
        }

        return res.status(200)
        .json(new ApiResponse(200,{isLiked:false},"video unliked successfully."))
    }
    
    const videoLikeCreated = await Like.create({
        video:videoId,
        likedBy:req.user._id
    })

    if(!videoLikeCreated){
        throw new ApiError(402,"Video like has not resgistered")
    }

    return res.status(200)
    .json(new ApiResponse(200,{isLiked:true},"video liked successfully."))
})

const toggleCommentLike = asyncHandler(async(req,res)=>{
    const { commentId } = req.params

    if (!commentId){
        throw new ApiError(401,"commentId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const comment = await Comment.findById(commentId)

    if (!comment){
        throw new ApiError(402,"Comment not found")
    }

    const commentLikedAlready = await Like.findOne(
        {
            comment:commentId,
            likedBy:req.user?._id
        })
    
    if(commentLikedAlready){
        const deletedCommentLike = await Like.findByIdAndDelete(commentLikedAlready._id)

        if(!deletedCommentLike){
            throw new ApiError(404,"Comment like not found or already deleted")
        }

        return res.status(200)
        .json(new ApiResponse(200,{isLiked:false},"Comment unliked successfully."))
    }
    
    const commentLikeCreated = await Like.create({
        comment:commentId,
        likedBy:req.user._id
    })

    if(!commentLikeCreated){
        throw new ApiError(402,"comment like has not resgistered")
    }

    return res.status(200)
    .json(new ApiResponse(200,{isLiked:true},"comment liked successfully."))
})

const toggleTweetLike = asyncHandler(async(req,res)=>{
    const { tweetId } = req.params

    if (!tweetId){
        throw new ApiError(401,"tweetId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet){
        throw new ApiError(402,"Tweet not found")
    }

    const tweetLikedAlready = await Like.findOne(
        {
            tweet:tweetId,
            likedBy:req.user?._id
        })
    
    if(tweetLikedAlready){
        const deletedTweetLike = await Like.findByIdAndDelete(tweetLikedAlready._id)

        if(!deletedTweetLike){
            throw new ApiError(404,"Tweet like not found or already deleted")
        }

        return res.status(200)
        .json(new ApiResponse(200,{isLiked:false},"Tweet unliked successfully."))
    }
    
    const tweetLikeCreated = await Like.create({
        tweet:tweetId,
        likedBy:req.user._id
    })

    if(!tweetLikeCreated){
        throw new ApiError(402,"Tweet like has not resgistered")
    }

    return res.status(200)
    .json(new ApiResponse(200,{isLiked:true},"Twwet liked successfully."))
})

export {toggleVideoLike,
        toggleCommentLike,
        toggleTweetLike, 
        getLikedVideos}