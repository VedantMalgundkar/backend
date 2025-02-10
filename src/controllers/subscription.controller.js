import mongoose from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    
    if (!channelId){
        throw new ApiError(401,"commentId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const checkUser = await User.findById(channelId)

    if(!checkUser){
        throw new ApiError(402,"Channel does not exsists")
    }

    const subscriptionExsists = await Subscription.findOne(
        {
            subscriber:req.user?._id,
            channel:channelId
        }
    )

    if(subscriptionExsists){
        const deletedSubscription = await Subscription.findOneAndDelete(
            {
                subscriber:req.user?._id,
                channel:channelId
            }
        )
        if(!deletedSubscription){
            throw new ApiError(402,"Subscription not found or already deleted")
        }

        return res.status(200)
        .json(new ApiResponse(200,{isSubscribed:false},"Channel unsubscribed successfully"))


    }

    const createdSubscription = await Subscription.create(
        {
            subscriber:req.user?._id,
            channel:channelId
        }
    )

    if(!createdSubscription){
        throw new ApiError(403,"Error occured while subscribing")
    }

    return res.status(200)
    .json(new ApiResponse(200,{isSubscribed:true},"Channel Subscribed successfully"))
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if (!channelId){
        throw new ApiError(401,"commentId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const checkUser = await User.findById(channelId)

    if(!checkUser){
        throw new ApiError(402,"Channel does not exsists")
    }

    const subs = await Subscription.aggregate([
        {
          $match: {
            channel: new mongoose.Types.ObjectId(channelId)
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "subscriber",
            foreignField: "_id",
            as: "subscriber",
            pipeline: [
              {
                $lookup: {
                  from: "subscriptions",
                  localField: "_id",
                  foreignField: "channel",
                  as: "subscribedToSubscriber",
                },
              },
              {
                $addFields: {
                  subscribedToSubscriber: {
                    $cond: {
                      if: {
                        $in: [
                            new mongoose.Types.ObjectId(channelId),
                            "$subscribedToSubscriber.subscriber",
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                  subscribersCount: {
                      $size: "$subscribedToSubscriber",
                    },
                }, 
              },
            ],
          },
        },
        {
            $unwind: "$subscriber",
        },
        {
          $project: {
            _id:0,
            subscriber:{
              _id: 1,
              username: 1,
              fullName: 1,
              "avatar.url": 1,
              subscribedToSubscriber: 1,
              subscribersCount: 1,
            }
          }
        }
      ])

    return res.status(200)
    .json(new ApiResponse(200,subs,"subscribers fetched successfully"))

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!subscriberId){
        throw new ApiError(401,"commentId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const checkUser = await User.findById(subscriberId)

    if(!checkUser){
        throw new ApiError(402,"Subscriber does not exsists")
    }

    const channelList = await Subscription.aggregate(
        [
            {
              $match: {
                  subscriber: new mongoose.Types.ObjectId(subscriberId)
                }
            },
            {
              $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline:[
                  {
                    $lookup:{
                      from:"videos",
                      localField:"_id",
                      foreignField:"owner",
                      as:"latestVideo",
                      pipeline:[
                        {
                          $sort:{
                            createdAt:-1
                          }
                        },
                        {
                          $limit:1
                        }
                        
                      ]
                    }
                  },
                  {
                    $addFields: {
                      latestVideo: {
                        $first:"$latestVideo"
                            }
                          }
                        }
                  
                ]
              }
            },
            {
              $unwind: {
                path: "$subscribedChannel",
              }
            },
            {
                  $project: {
                      _id: 0,
                      subscribedChannel: {
                          _id: 1,
                          username: 1,
                          fullName: 1,
                          "avatar.url": 1,
                          latestVideo: {
                              _id: 1,
                              "videoFile.url": 1,
                              "thumbnail.url": 1,
                              owner: 1,
                              title: 1,
                              description: 1,
                              duration: 1,
                              createdAt: 1,
                              views: 1
                          },
                      },
                  },
            },
                
            
          ]
    )

    res.status(200)
    .json(new ApiResponse(200,channelList,"channel list of user fetched successfully."))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}