import { Router } from "express"
import { registerUser , loginUser , logoutUser, refereshAccessToken, updatePasswordUser, updateDetailsUser, updateAvatarUser, updateCoverImageUser, getCurrentUser,getWatchHistory , getUserChannelProfile } from "../controllers/user.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()


router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)


router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-tokens").post(refereshAccessToken)

router.route("/update-password").post(verifyJWT,updatePasswordUser)

router.route("/update-details").post(verifyJWT,updateDetailsUser)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatarUser)

router.route("/update-coverImage").patch(verifyJWT,upload.single("coverImage"),updateCoverImageUser)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/watchHistory").get(verifyJWT,getWatchHistory)

router.route("/get-channel-profile/channel/:username").get(verifyJWT,getUserChannelProfile)


export default router