import { Router } from "express"
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js" 
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/get-channel-stats").get(getChannelStats)
router.route("/get-channel-videos").get(getChannelVideos)

export default router