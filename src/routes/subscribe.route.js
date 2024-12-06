import { Router } from "express"; 
import { toggleSubscription } from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription)
// router.route("/toggle-comment-like/:commentId").post(toggleCommentLike)
// router.route("/toggle-video-like/:videoId").post(toggleVideoLike)

export default router