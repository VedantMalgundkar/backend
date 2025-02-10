import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials: true,
}))

app.use(express.json({limit:"1mb"}))
app.use(express.urlencoded({extended:true,limit:"1mb"}))
app.use(express.static("public"))
app.use(cookieParser())

// routes import

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.route.js"
import tweetRouter from "./routes/tweet.route.js"
import likeRouter from "./routes/like.route.js"
import playlistRouter from "./routes/playlist.route.js"
import subcribeRouter from "./routes/subscribe.route.js"
import dashboardRouter from "./routes/dashboard.route.js"

// routes declaration
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/tweets",tweetRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/subscription",subcribeRouter)
app.use("/api/v1/dashboard",dashboardRouter)

export { app }