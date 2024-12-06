import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadToCloudnary, updatetoCloudnary, deletetoCloudnary } from "../utils/cloudinary.js"
import { Video } from "../models/video.model.js"

const uploadVideo = asyncHandler(async(req,res)=>{
    const {title,description} = req.body
    
    if ((!title?.trim()) || (!description?.trim()) || (!req.files?.videoFile) || (!req.files?.thumbnail)){
        throw new ApiError(403,"All Fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(400,"videoFile or thumbnail file is missing")
    }

    const videoFileRes = await uploadToCloudnary(videoFileLocalPath)
    const thumbnailRes = await uploadToCloudnary(thumbnailLocalPath)

    if(!videoFileRes){
        throw ApiError(400,"videoFile upload failed")
    }
    if(!thumbnailRes){
        throw ApiError(400,"thumbnail upload failed")
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
        throw new ApiError(400,"Video not found.")
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
    
    res.status(200)
    .json(new ApiResponse(200,deleteVideo,`Video with ${videoId} id deleted successfully`))

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


export { uploadVideo, updateVideoDetails, deleteVideo, updateVideoThumbnail }