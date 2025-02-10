import { asyncHandler } from "../utils/asyncHandler.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import mongoose from "mongoose"
import { ApiResponse } from "../utils/ApiResponse.js"

const getChannelStats = asyncHandler( async(req,res)=>{
    const userId = req?.user.id
    // subscriber count

    const userSubscribers = await Subscription.aggregate(
    [
        {
          $match: {
            channel:new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $group: {
            _id: "$channel",
            subscribersCount: {
              $sum: 1
            }
          }
        }
    ])
    // videos, videolikes , videoViews

    const userStats = await Video.aggregate(
        [
            {
              $match: {
                owner:new mongoose.Types.ObjectId(userId)
              }
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "totalVideoLikes"
              }
            },
            {
              $addFields: {
                totalVideoLikes: {$size:"$totalVideoLikes"},
                totalVideoViews: "$views",
                totalVideos: 1,
              }
            },
            {
              $project: {
                totalVideoLikes:1,
                totalVideoViews:1,
                totalVideos: 1,
                owner:1
              }
            },
            {
              $group: {
                _id: "$owner",
                totalVideoLikes: {
                    $sum:"$totalVideoLikes",
                    },
                totalVideoViews: {
                    $sum:"$totalVideoViews",
                    },
                totalVideos:{
                    $sum:"$totalVideos"
                  },
              }
            }
          ]
    )

    const allStats = {
        subscribersCount : userSubscribers[0]?.subscribersCount || 0,
        totalVideos : userStats[0]?.totalVideos || 0,
        totalVideoLikes : userStats[0]?.totalVideoLikes || 0,
        totalVideoViews : userStats[0]?.totalVideoViews || 0
    }

    return res.status(200)
    .json(new ApiResponse(200,allStats,"users stats fetched successfully."))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;

    const uservideos = await Video.aggregate(
        [
            {
                $match:{
                    owner:new mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup:{
                    from:"likes",
                    localField:"_id",
                    foreignField:"video",
                    as:"likes",
                }
            },
            {
                $addFields:{
                    likesCount:{$size:"$likes"},
                          createdAt: {
                          $dateToParts: { date: "$createdAt" }
                    },
                }
            },
            {
                $sort:{
                    createdAt:-1
                }
            },
            {
                $project:{
                    _id:1,
                    "videoFile.url":1,
                    "thumbnail.url":1,
                    title:1,
                    description:1,
                    createdAt:{
                      year:1,
                      month:1,
                      day:1
                    },
                    isPublished:1,
                    likesCount:1
                }
        
            }
        ]
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            uservideos,
            "channel videos fetched successfully"
        )
    );


});


export {
    getChannelStats,
    getChannelVideos
}