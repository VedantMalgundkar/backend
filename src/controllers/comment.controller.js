import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js"

// const getVideoComments = asyncHandler((req,res)=>{
//     const { videoId } = req.params
//     const {page = 1,limit = 10} = req.query

//     if(!videoId){
//         return ApiError(401,"requested video is invalid")
//     }

//     const requestedVideo = await Video.findById(videoId)

//     if(!requestedVideo){
//         return ApiError(401,"requested video doesn't exsists")
//     }
    
//     const skip = (Number(page) - 1) * Number(limit)

//     // const comments = await Comment.find({video:requestedVideo._id})
//     //   .sort({ createdAt: -1 })
//     //   .skip(Number(skip))
//     //   .limit(Number(limit));

//     const commentsAgrregate = Comment.aggregate([
//         {
//             $match:{
//                 video:mongoose.Types.ObjectId(requestedVideo._id)
//             },
//             {


//             }
//         }
//     ])


//     const totalNoOfComments = await Comment.countDocuments();

//     res.status(200).json(new ApiResponse(
//         200,
//         {
//             totalNoOfComments,
//             page:Number(page),
//             limit:Nmber(limit),
//             totalPages:Math.ceil(totalNoOfComments/Number(limit)),
//             comments,
//         },
//         "Comments fetched successfully."
//     )) 
 
// })

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body

    if(!videoId){
        throw new ApiError(401,"requested video is invalid")
    }

    const requestedVideo = await Video.findById(videoId)

    if(!requestedVideo){
        throw new ApiError(401,"requested video doesn't exsists")
    }

    if (!content?.trim()){
        throw new ApiError(401,"Comment should not be empty")
    }

    const comment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id  
    })

    if(!comment){
        throw new ApiError(500,"Something went wrong while saving comment")
    }

    return res.status(200)
    .json(
        new ApiResponse(200,comment,"comment created successfully.")
    )

})

const updateComment = asyncHandler(async (req, res) => {

    const { contentId } = req.params
    const { content } = req.body

    if(!contentId){
        return ApiError(401,"requested commentId is invalid")
    }

    const comment = await Comment.findById(contentId)

    if (comment.owner.toString() != req.user?._id.toString()){
        throw new ApiError(401,"Requested user is not the owner of this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(comment?._id,{
        $set: {
            content:content
        }
    },{new:true})

    if (!updatedComment){
        throw new ApiError(500,"Something went wrong while updating comment")
    }

    return res.status(200)
    .json(new ApiResponse(200,updatedComment,"Comment updated successfully"))

})

const deleteComment = asyncHandler(async (req, res) => {

    const { contentId } = req.params

    if(!contentId){
        return ApiError(401,"requested commentId is invalid")
    }

    const comment = await Comment.findById(contentId)

    if (!comment){
        throw new ApiError(403,"Comment not found")
    }

    if (comment.owner.toString() != req.user?._id.toString()){
        throw new ApiError(401,"Requested user is not the owner of this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(comment?._id)

    return res.status(200)
    .json(new ApiResponse(200,deletedComment,"Comment deleted successfully"))

})

export {
    deleteComment,
    updateComment,
    addComment
}