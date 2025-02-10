import { Router } from "express"
import { deleteComment, updateComment, addComment, getVideoComments} from "../controllers/comment.controller.js" 
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/get-comments/:videoId").get(getVideoComments)
router.route("/add-comment/:videoId").post(upload.none(),addComment)
router.route("/update-comment/:contentId").patch(upload.none(),updateComment)
router.route("/del-comment/:contentId").delete(deleteComment)


export default router