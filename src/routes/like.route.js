import { Router } from "express"; 
import { toggleTweetLike, toggleCommentLike, toggleVideoLike } from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle-tweet-like/:tweetId").post(toggleTweetLike)
router.route("/toggle-comment-like/:commentId").post(toggleCommentLike)
router.route("/toggle-video-like/:videoId").post(toggleVideoLike)

export default router