import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'videoFile') {
      const allowedVideoTypes = ['video/mp4', 'video/mkv', 'video/avi', 'video/mov'];
      
      if (!allowedVideoTypes.includes(file.mimetype)) {
        return cb(new ApiError(403,"Invalid file type. Only video files are allowed for the 'fileName' field."));
      }
    }
    cb(null, true);
  };

const storage = multer.diskStorage({
    destination:function(req,file,cb) {
        cb(null,"./public/temp")
    },
    filename:function(req,file,cb) {
        cb(null,file.originalname)
    }
})

const upload = multer({storage:storage,fileFilter:fileFilter})
// const upload = multer({storage:storage})

export { upload }