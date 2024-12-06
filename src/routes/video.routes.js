import { Router } from "express"
import { uploadVideo, updateVideoDetails, deleteVideo, updateVideoThumbnail } from "../controllers/video.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/v/:videoId").patch(upload.none(),updateVideoDetails)

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
router.route("/update-thumbnail/:videoId").patch(upload.single("thumbnail"),updateVideoThumbnail)

export default router