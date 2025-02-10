import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadToCloudnary, updatetoCloudnary, deletetoCloudnary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Like } from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"

const uploadVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body
    
    if ((!title?.trim()) || (!description?.trim()) || (!req.files?.videoFile) || (!req.files?.thumbnail)){
        throw new ApiError(400,"All Fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"videoFile or thumbnail file is missing")
    }

    const videoFileRes = await uploadToCloudnary(videoFileLocalPath)
    const thumbnailRes = await uploadToCloudnary(thumbnailLocalPath)

    if(!videoFileRes){
        throw ApiError(500,"videoFile upload failed")
    }
    if(!thumbnailRes){
        throw ApiError(500,"thumbnail upload failed")
    }
    
    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoFileRes.url,
            public_id: videoFileRes.public_id
        },
        thumbnail: {
            url:thumbnailRes.url,
            public_id:thumbnailRes.public_id
        },
        duration: videoFileRes.duration,
        owner: req.user?._id,
    });

    const createdVideo = await Video.findById(video._id)

    if(!createdVideo){
        throw new ApiError(500,"Something went wrong while uploading video the user")
    }

    return res.status(201).json(new ApiResponse(200,createdVideo,"Video uploaded successfully."))

});


const updateVideoDetails = asyncHandler(async (req,res)=>{
    const { videoId } = req.params   
    const { title,description } = req.body

    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }

    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(404,"Video not found.")
    }

    if(req.user.id != video.owner){
        throw new ApiError(400,"User is not authorized to update")
    }

    if (!title && !description){
        throw new ApiError(402,"title or description is required.")
    }

    let updatedVideo;

    if (title){
        updatedVideo = await Video.findByIdAndUpdate(video._id,
            {
                $set:{
                    title:title
                }
            },
            {new:true}
        )
    }
    if (description){
        updatedVideo = await Video.findByIdAndUpdate(video._id,
            {
                $set:{
                    description:description
                }
            },
            {new:true}
        )
    }

    return res.status(200)
    .json(new ApiResponse(200,updatedVideo,"Video updated successfully"))

})


const deleteVideo = asyncHandler(async (req,res)=>{
    const { videoId } = req.params

    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }

    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(400,"Video not found.")
    }

    if(req.user.id != video.owner){
        throw new ApiError(400,"User is not authorized to delete")
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(401,`${deletedVideo} Video not found or already deleted`)
    }

    const delThumbnailRes = await deletetoCloudnary(deletedVideo.thumbnail.public_id) 
    const delVideoRes = await deletetoCloudnary(deletedVideo.videoFile.public_id,"video")

    if(delThumbnailRes.delResponse.result!="ok"){
        throw new ApiError(403,`Error occured while deleting old thumbnail ${deletedVideo.thumbnail.public_id}`)
    }

    if(delVideoRes.delResponse.result!="ok"){
        throw new ApiError(403,`Error occured while deleting old video ${deletedVideo.videoFile.public_id}`)
    }

    await Comment.deleteMany({
        video:videoId
    })

    await Like.deleteMany({
        video:videoId
    })

    res.status(200)
    .json(new ApiResponse(200,deletedVideo,`Video with ${videoId} id deleted successfully`))

})


const updateVideoThumbnail = asyncHandler(async (req,res)=>{
    const { videoId } = req.params

    if (!req.file){
        throw new ApiError(401,"Thumbnail image should exsist")
    }

    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }
    
    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(400,"Video not found.")
    }

    if(req.user.id != video.owner){
        throw new ApiError(400,"User is not authorized to update")
    }

    const {newResponse , delResponse} = await updatetoCloudnary(req.file.path,video.thumbnail.public_id)

    if(delResponse.result!="ok"){
        throw new ApiError(403,`Error occured while deleting old thumbnail ${video.thumbnail.public_id}`)
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set: {
               thumbnail:
                {
                    url : newResponse.url,
                    public_id : newResponse.public_id
                }
            }
        },
        {
            new: true
        }
    )

    if(!updatedVideo){
        throw new ApiError(200,"Error occured while updating video thumbnail")
    }

    return res.status(200).json(new ApiResponse(200,updatedVideo,"Thumbnail Image Updated successfully."))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(400,"Video not found.")
    }

    if (video?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400,"User is not authorized to change publish status")
    }


    const toggledVideo = await Video.findByIdAndUpdate(videoId,
        {
            $set:{
                isPublished:!video.isPublished
            }
        },
        {new:true}
    )

    if(!toggledVideo){
        throw new ApiError(400,"Error occured while changing the video status")
    }

    return res.status(200)
    .json(new ApiResponse(200,{isPublished :toggledVideo.isPublished},`video ${toggledVideo.isPublished==true?"published":"unpublished"} successfully`))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if (!videoId){
        throw new ApiError(401,"VideoId is invalid")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401,"Invalid ObjectId format")
    }

    const video = await Video.findById(videoId)

    if (!video){
        throw new ApiError(400,"Video not found.")
    }

    const videoDet = await Video.aggregate(
        [
            {
              $match: {
                _id: new mongoose.Types.ObjectId(videoId) // ObjectId("67515009163cb075453cee4f")
              }
            },
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline:[
                  {
                    $lookup:{
                      from:"subscriptions",
                      localField:"_id",
                      foreignField:"channel",
                      as:"subscribers"
                    }
                  },
                  {
                    $addFields:{
                      subcribersCount:{
                        $size:"$subscribers"
                        },
                      isSubscribed:{
                        $cond:{
                          if:{
                            $in:[req.user?._id,"$subscribers.subscriber"]
                          },
                          then:true,
                          else:false
                        }
                      }
                    }
                  },
                  {
                    $project: {
                        username: 1,
                        "avatar.url": 1,
                        subcribersCount: 1,
                        isSubscribed: 1
                    }
                  }
                ]
              }
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
              }
            },
            {
              $addFields: {
                  likesCount:{
                  $size:"$likes"
                },
                owner:{
                    $first:"$owner"
                  },
                isLiked:{
                  $cond:{
                    if:{
                            $in:[req.user?._id,"$likes.likedBy"]
                       },
                    then:true,
                    else:false
                  }
                }
                }
            },
            {
              $project: {
                "videoFile.url":1,
                title: 1,
                description: 1,
                views: 1,
                createdAt: 1,
                duration: 1,
                comments: 1,
                owner: 1,
                likesCount: 1,
                isLiked: 1
              }
            }
          ]
    )


    if(!videoDet){
        throw new ApiError(403,"Failed to fetch video details.")
    }

    await User.findByIdAndUpdate(req.user?._id,
        {
            $addToSet:{
                watchHistory: videoDet[0]._id
            }
        })

    await Video.findByIdAndUpdate(videoDet[0]._id,
        {
            $inc:{
                views:1
            }
        })

    return res.status(200)
    .json(new ApiResponse(200,videoDet[0],"video fetched successfully"))

})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = []

    if(query){
        pipeline.push(
            {
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"]
                    }
                }
            }
        )
    }
    

    if(userId){
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(401,"Invalid ObjectId format")
        }

        pipeline.push(
            {
                $match: {
                  "owner": new mongoose.Types.ObjectId(userId)
                }
            }

        );
    }

    pipeline.push(
        {
            $match: {
              "isPublished":true
            }
        }
    );

    if(sortBy && sortType){
        pipeline.push(
            {
                $sort: {
                    [sortBy]: sortType === "asc" ? 1 : -1
                }
            }

        );
    } else {
        pipeline.push(
            {
                $sort: {
                    "createdAt": -1
                }
            }
        )
    }

    pipeline.push(
        {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline:[
                  {
                    $project: {
                      username:1,
                      "avatar.url":1
                    }
                  }
                ]
                
            },
        },
        {
            $unwind: {
                path: "$ownerDetails",
            }
        }
    )
    const videoAggregate = Video.aggregate(pipeline)

    const options = {
        page: parseInt(page,10),
        limit: parseInt(limit,10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate,options)

    return res.status(200)
    .json(new ApiResponse(200,videos,"Videos fetched successfully."))
})

export { 
    uploadVideo, 
    updateVideoDetails, 
    deleteVideo, 
    updateVideoThumbnail,
    togglePublishStatus, 
    getVideoById,
    getAllVideos,
}