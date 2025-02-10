import mongoose,{Schema} from "mongoose"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(401, "Requested video is invalid");
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401, "Invalid ObjectId format");
    }

    const requestedVideo = await Video.findById(videoId);
    if (!requestedVideo) {
        throw new ApiError(401, "Requested video doesn't exist");
    }

    const CommentsAggregate = Comment.aggregate([
        { 
            $match: { video: new mongoose.Types.ObjectId(videoId) } 
        },
        { 
            $lookup: { 
                from: "users", 
                localField: "owner", 
                foreignField: "_id", 
                as: "owner" 
            } 
        },
        { 
            $lookup: { 
                from: "likes", 
                localField: "_id", 
                foreignField: "comment", 
                as: "commentLikes" 
            } 
        },
        { 
            $addFields: { 
                noOfLikes: { $size: "$commentLikes" }, 
                owner: { 
                    $first: {
                        $map: {
                            input: "$owner",
                            as: "owner",
                            in: {
                                username: "$$owner.username",
                                fullName: "$$owner.fullName",
                                avatar: "$$owner.avatar"
                            }
                        }
                    }
                },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$commentLikes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            } 
        },
        { 
            $sort: { createdAt: -1 } 
        },
        { 
            $project: { 
                _id: 1, 
                content: 1, 
                createdAt: 1, 
                noOfLikes: 1, 
                "owner.avatar.url": 1, 
                "owner.username": 1, 
                "owner.fullName": 1, 
                isLiked: 1 
            } 
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)    
    };

    const comments = await Comment.aggregatePaginate(CommentsAggregate, options);

    return res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
});


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
    addComment,
    getVideoComments
}