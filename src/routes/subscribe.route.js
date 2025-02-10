import { Router } from "express"; 
import { toggleSubscription ,getSubscribedChannels, getUserChannelSubscribers} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.use(verifyJWT)

router.route("/toggle-subscription/:channelId").post(toggleSubscription)
router.route("/channel-list/sub/:subscriberId").get(getSubscribedChannels)
router.route("/subs-list/channel/:channelId").get(getUserChannelSubscribers)

export default router