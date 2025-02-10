import { Router } from "express"; 
import { toggleTweetLike, toggleCommentLike, toggleVideoLike, getLikedVideos } from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/get-liked-videos").get(getLikedVideos)
router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike)
router.route("/toggle-comment-like/:commentId").post(toggleCommentLike)
router.route("/toggle-video-like/:videoId").post(toggleVideoLike)

export default router