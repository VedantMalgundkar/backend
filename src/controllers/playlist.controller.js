import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"



const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(402,"All fields are required.")
    }

    const exsistingPlaylist = await Playlist.findOne({
        name:name?.trim(),
        description:description?.trim(),
        owner:req.user._id
    })

    if(exsistingPlaylist){
        throw new ApiError(402,"playlist with same descrpition already exsists")
    }

    const playlist = await Playlist.create({
        name:name?.trim(),
        description:description?.trim(),
        owner:req.user._id
    })

    if(!playlist){
        throw new ApiError(402,"Error occured While creating playlist")
    }

    res.status(200)
    .json(new ApiResponse(200,playlist,"playlist created successfully"))
    //TODO: create playlist
})

// const getUserPlaylists = asyncHandler(async (req, res) => {
//     const {userId} = req.params
//     //TODO: get user playlists
// })

// const getPlaylistById = asyncHandler(async (req, res) => {
//     const {playlistId} = req.params
//     //TODO: get playlist by id
// })

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw ApiError(402,"playlistId & videoId parameters are required.")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(401,"playlistId has Invalid ObjectId format")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401,"videoId has Invalid ObjectId format")
    }

    const playlistCheck = await Playlist.findById(playlistId)
    const videoCheck = await Video.findById(videoId)

    if (!playlistCheck){
        throw new ApiError(403,"Playlist does not exsists.")
    }

    if (!videoCheck){
        throw new ApiError(403,"Video does not exsists.")
    }

    const updatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user?._id }, 
        { $addToSet: { videos: videoId } }, 
        { new: true }
    );

    if (!updatePlaylist){
        throw new ApiError(402,"Error occured while updating playlist")

    }
    console.log(updatedPlaylist);
    

    res.status(200)
    .json(new ApiResponse(200,updatedPlaylist,"video added in playlist successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw ApiError(402,"playlistId & videoId parameters are required.")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(401,"playlistId has Invalid ObjectId format")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(401,"videoId has Invalid ObjectId format")
    }

    const playlistCheck = await Playlist.findById(playlistId)
    const videoCheck = await Video.findById(videoId)

    if (!playlistCheck){
        throw new ApiError(403,"Playlist does not exsists.")
    }

    if (!videoCheck){
        throw new ApiError(403,"Video does not exsists.")
    }

    const truncatedPlaylist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user?._id }, 
        { $pull : { videos: videoId } }, 
        { new: true }
    );

    if(!truncatedPlaylist){
        throw new ApiError(403,"Error occured while truncating playlist")
    }

    console.log(truncatedPlaylist);

    res.status(200)
    .json(new ApiResponse(200,truncatedPlaylist,"Video truncated from playlist successfully"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw ApiError(402,"playlistId is required.")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(401,"playlistId has Invalid ObjectId format")
    }

    const playlistCheck = await Playlist.findById(playlistId)

    if (!playlistCheck){
        throw new ApiError(403,"Playlist does not exsists.")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw ApiError(403,"Playlist not found or already deleted")
    }

    res.status(200)
    .json(new ApiResponse(200,deletedPlaylist,"Playlist deleted successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!name?.trim() && !description?.trim()){
        throw new ApiError(402,"name or description is required")
    }

    if(!playlistId){
        throw ApiError(402,"playlistId is required.")
    }

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(401,"playlistId has Invalid ObjectId format")
    }

    const playlistCheck = await Playlist.findById(playlistId)

    if (!playlistCheck){
        throw new ApiError(403,"Playlist does not exsists.")
    }

    const updateData = {}

    if (name?.trim()){
        updateData.name = name?.trim()
    }  

    if (description?.trim()){
        updateData.description = description?.trim()
    }  

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        updateData,
        {new:true}
    )

    if(!updatedPlaylist){
        throw new ApiError(401,"Error occured while updating playlist")
    }

    //TODO: update playlist
    res.status(200)
    .json(new ApiResponse(200,updatedPlaylist,"playlist updated successfully"))
})

export {
    createPlaylist,
    // getUserPlaylists,
    // getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}