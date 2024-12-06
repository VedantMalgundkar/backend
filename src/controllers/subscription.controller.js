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

// // controller to return subscriber list of a channel
// const getUserChannelSubscribers = asyncHandler(async (req, res) => {
//     const {channelId} = req.params
// })

// // controller to return channel list to which user has subscribed
// const getSubscribedChannels = asyncHandler(async (req, res) => {
//     const { subscriberId } = req.params
// })

export {
    toggleSubscription,
    // getUserChannelSubscribers,
    // getSubscribedChannels
}