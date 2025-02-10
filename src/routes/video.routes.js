import { Router } from "express"
import { uploadVideo, updateVideoDetails, deleteVideo, updateVideoThumbnail, 
    togglePublishStatus, getVideoById, getAllVideos } from "../controllers/video.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/update-video/:videoId").patch(upload.none(),updateVideoDetails)

router.route("/upload").post(upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),uploadVideo)

router.route("/del/:videoId").delete(deleteVideo)
router.route("/get-video/:videoId").get(getVideoById)
router.route("/").get(getAllVideos)
router.route("/update-thumbnail/:videoId").patch(upload.single("thumbnail"),updateVideoThumbnail)
router.route("/toggle-video/:videoId").patch(togglePublishStatus)

export default router