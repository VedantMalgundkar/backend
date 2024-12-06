import { Router } from "express"
import { uploadTweet, updateTweet, deleteTweet } from "../controllers/tweet.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/upload-tweet").post(upload.none(),uploadTweet)
router.route("/update-tweet/:tweetId").patch(upload.none(),updateTweet)
router.route("/delete-tweet/:tweetId").delete(deleteTweet)

export default router