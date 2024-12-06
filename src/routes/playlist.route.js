import { Router } from "express"
import { createPlaylist, addVideoToPlaylist, removeVideoFromPlaylist, deletePlaylist, updatePlaylist } from "../controllers/playlist.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/create-playlist").post(upload.none(),createPlaylist)
router.route("/update-playlist/:playlistId").patch(upload.none(),updatePlaylist)
router.route("/add-video-to-playlist/playlist/:playlistId/video/:videoId").patch(upload.none(),addVideoToPlaylist)
router.route("/rem-video-from-playlist/playlist/:playlistId/video/:videoId").patch(upload.none(),removeVideoFromPlaylist)
router.route("/del-playlist/:playlistId").delete(upload.none(),deletePlaylist)

export default router