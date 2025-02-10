import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import { Like } from "../models/like.model.js"
import { Playlist } from "../models/playlist.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Tweet } from "../models/tweet.model.js"


import { faker } from '@faker-js/faker';

function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomSample(array, n) {
  if (n > array.length) {
    throw new Error('n must be less than or equal to the length of the array');
  }
  
  for (let i = array.length - 1; i > array.length - 1 - n; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
  }
  
  return array.slice(array.length - n);
}

async function uploadAVideo(userId){
    const videoName = `${faker.string.uuid()}.mp4`
    const thumbnailName = `${faker.string.uuid()}.jpg`
    const video = await Video.create({
        videoFile:{
            url:videoName,
            public_id:videoName.split(".")[0]
        },
        thumbnail:{
            url:thumbnailName,
            public_id:thumbnailName.split(".")[0]
        },
        title: faker.lorem.words(5),
        description:faker.lorem.paragraph(),
        duration:faker.number.int({ min: 60, max: 7200 }), 
        owner:userId
    })

    return video
}

async function uploadAComment(userId,videoId){
    const comment = await Comment.create({
        video:videoId,
        content:faker.lorem.sentence(),
        owner:userId
    })
    return comment
}

async function uploadATweet(userId){
    const tweet = await Tweet.create({
        content:faker.lorem.sentence(),
        owner:userId
    })
    return tweet
}

async function uploadALike(uploadObj){
    const like = await Like.create(uploadObj)
    return like
}

async function uploadASubscription(uploadObj){
    const subscription = await Subscription.create(uploadObj)
    return subscription
}

async function uploadAPlaylist(uploadObj){
    const playlist = await Playlist.create(uploadObj)
    return playlist
}

async function seedDatabase() {
    // const users = []
    const noOfUsers = getRandomInteger(80,90)

    // for (let index = 0; index < noOfUsers; index++) {

    //     const fname = faker.person.firstName();
    //     const lname = faker.person.lastName();
    //     const userName = faker.internet.username({ firstName: fname, lastName: lname })
    //     const userEmail =faker.internet.email({ firstName: fname, lastName: lname })

    //     const avatar_name = `${faker.string.uuid()}.${['jpg', 'png'][Math.floor(Math.random() * 2)]}`
    //     const coverImage_name = `${faker.string.uuid()}.${['jpg', 'png'][Math.floor(Math.random() * 2)]}`

    //     const user = await User.create({
    //         fullName: fname +" "+ lname,
    //         username:userName,
    //         email:userEmail,
    //         avatar:{
    //             url:avatar_name,
    //             public_id:avatar_name.split(".")[0]
    //         },
    //         coverImage:{
    //             url:coverImage_name,
    //             public_id:coverImage_name.split(".")[0]
    //         },
    //         password:userName.slice(0,3)+userEmail.slice(0,3)+lname
    //     })
        
    //     users.push(user)
    // }

    const usersPromise = Array.from({length:noOfUsers},()=>{
        const fname = faker.person.firstName();
        const lname = faker.person.lastName();
        const userName = faker.internet.username({ firstName: fname, lastName: lname })
        const userEmail =faker.internet.email({ firstName: fname, lastName: lname })

        const avatar_name = `${faker.string.uuid()}.${['jpg', 'png'][Math.floor(Math.random() * 2)]}`
        const coverImage_name = `${faker.string.uuid()}.${['jpg', 'png'][Math.floor(Math.random() * 2)]}`

        const user = User.create({
            fullName: fname +" "+ lname,
            username:userName,
            email:userEmail,
            avatar:{
                url:avatar_name,
                public_id:avatar_name.split(".")[0]
            },
            coverImage:{
                url:coverImage_name,
                public_id:coverImage_name.split(".")[0]
            },
            password:userName.slice(0,3)+userEmail.slice(0,3)+lname
        })

        return user

    })

    const users = await Promise.all(usersPromise)

    console.log(`seeded ${users.length} users successfully`);
    

    // const videos = []


    const twoDVideoPromises = users.map((user)=>{
        const noOfvideos = getRandomInteger(1,10)
        const eachUserVideosPromise = Array.from({length:noOfvideos},()=>{
            return uploadAVideo(user._id)
        })

        return Promise.all(eachUserVideosPromise)

    })

    const twoDvideos = await Promise.all(twoDVideoPromises)
 
    const videos = twoDvideos.flat()

    // for (let index = 0; index < users.length; index++) {
    //     const randomUser = users[Math.floor(Math.random()*users.length)]
    //     const noOfvideos = getRandomInteger(1,10)
    //     for (let vidIndex = 0; vidIndex < noOfvideos; vidIndex++) {
    //         const video = await uploadAVideo(randomUser._id)
    //         videos.push(video)
    //     }
        
    // }
    
    console.log(`seeded ${videos.length} videos successfully`);

    // const comments = []

    // for (let videoIndex = 0; videoIndex < videos.length ; videoIndex++) {
    //     const noOfComments = getRandomInteger(1,5)
    //     for (let commentIndex = 0; commentIndex < noOfComments; commentIndex++) {
    //         const randomUser = users[Math.floor(Math.random()*users.length)]
    //         const randomVideo = videos[videoIndex]
    //         const comment = await uploadAComment(randomUser._id,randomVideo._id)

    //         comments.push(comment)
    //     }

    // }


    const allVideoCommentsPromises = videos.map((video)=>{
        const noOfComments = getRandomInteger(1,5)
        
        const commentPromises = Array.from({length:noOfComments}).map(()=>{
            const randomUser = users[Math.floor(Math.random()*users.length)]
            return uploadAComment(randomUser._id,video._id)
        })

        return Promise.all(commentPromises)

    })

    const TwoDArrayComments = await Promise.all(allVideoCommentsPromises) 

    const comments = TwoDArrayComments.flat();
    
    console.log(`seeded ${comments.length} comments successfully`);
    


    const tweets = []
    const noOfTweet = getRandomInteger(30,40)

    for (let tweetIndex = 0; tweetIndex < noOfTweet; tweetIndex++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const tweet = await uploadATweet(randomUser._id)
        tweets.push(tweet)
    }

    console.log(`seeded ${tweets.length} tweets successfully`);

    const likes = []

    const noOfLikes = getRandomInteger(200,250)
    
    for (let likeIndex = 0; likeIndex < noOfLikes; likeIndex++) {
        const choice = Math.floor(Math.random()*3) // ["video","tweet","comment"]

        if (choice == 0){
            let randomVideo = videos[Math.floor(Math.random()*videos.length)]._id
            let randomUser = users[Math.floor(Math.random()*users.length)]._id
            
            let alreadyLiked = likes.some(like => 
                like && like.video && like.likedBy && 
                like.video.toString() === randomVideo.toString() && 
                like.likedBy.toString() === randomUser.toString()
            );
            
            while (alreadyLiked){
                randomVideo = videos[Math.floor(Math.random()*videos.length)]._id
                randomUser = users[Math.floor(Math.random()*users.length)]._id
                alreadyLiked = likes.some(like => 
                    like && like.video && like.likedBy && 
                    like.video.toString() === randomVideo.toString() && 
                    like.likedBy.toString() === randomUser.toString()
                );
            }

            const likeData = {
                video: randomVideo,
                likedBy: randomUser
            };

            const like = await uploadALike(likeData)
            likes.push(like)
            
        }
        if (choice == 1){
            let randomTweet = tweets[Math.floor(Math.random()*tweets.length)]._id
            let randomUser = users[Math.floor(Math.random()*users.length)]._id
            
            let alreadyLiked = likes.some(like => 
                like && like.tweet && like.likedBy && 
                like.tweet.toString() === randomTweet.toString() && 
                like.likedBy.toString() === randomUser.toString()
            );

            while (alreadyLiked){
                randomTweet = tweets[Math.floor(Math.random()*tweets.length)]._id
                randomUser = users[Math.floor(Math.random()*users.length)]._id
                alreadyLiked = likes.some(like => 
                    like && like.tweet && like.likedBy && 
                    like.tweet.toString() === randomTweet.toString() && 
                    like.likedBy.toString() === randomUser.toString()
                );
            }

            const likeData = {
                tweet:randomTweet,
                likedBy:randomUser
            }

            const like = await uploadALike(likeData)
            likes.push(like)
        }
        if (choice == 2){
            let randomComment = comments[Math.floor(Math.random()*comments.length)]._id
            let randomUser = users[Math.floor(Math.random()*users.length)]._id

            let alreadyLiked = likes.some(like => 
                like && like.comment && like.likedBy && 
                like.comment.toString() === randomComment.toString() && 
                like.likedBy.toString() === randomUser.toString()
            );
            
            while (alreadyLiked){
                randomComment = comments[Math.floor(Math.random()*comments.length)]._id
                randomUser = users[Math.floor(Math.random()*users.length)]._id
                alreadyLiked = likes.some(like => 
                    like && like.comment && like.likedBy && 
                    like.comment.toString() === randomComment.toString() && 
                    like.likedBy.toString() === randomUser.toString()
                );
            }

            const likeData = {
                comment:randomComment,
                likedBy:randomUser
            }
            const like = await uploadALike(likeData)
            likes.push(like)
        }
        
    }

    console.log(`seeded ${likes.length} likes successfully`);

    const subscriptions = []

    const noOfSubscriptions = getRandomInteger(60,70)

    for (let subsIndex = 0; subsIndex < noOfSubscriptions; subsIndex++) {
        let user1 = users[Math.floor(Math.random() * users.length)]._id
        let user2 = users[Math.floor(Math.random() * users.length)]._id 
        let alreadySubs = subscriptions.some(sub => sub.subscriber.toString() === user1.toString() && sub.channel.toString() === user2.toString());

        while(alreadySubs){
            user1 = users[Math.floor(Math.random() * users.length)]._id
            user2 = users[Math.floor(Math.random() * users.length)]._id 
            alreadySubs = subscriptions.some(sub => sub.subscriber.toString() === user1.toString() && sub.channel.toString() === user2.toString());
        }

        const subsData = {
            subscriber:user1,
            channel:user2
        }

        const sub = await uploadASubscription(subsData)

        subscriptions.push(sub)
    }

    console.log(`seeded ${subscriptions.length} subscriptions successfully`);

    const playlists = []
    const noOfPlaylists = getRandomInteger(10,15)

    for (let playlistIndex = 0; playlistIndex < noOfPlaylists; playlistIndex++) {

        const usersWhoHasUploadedVideo = videos.map((video)=>video.owner)
        const uniqueUsers = [...new Set(usersWhoHasUploadedVideo)];

        const randomUser = uniqueUsers[Math.floor(Math.random() * uniqueUsers.length)]
        
        const randomUsersAllVideos = videos.filter((video)=>video.owner.toString() === randomUser.toString()).map((video)=>video._id)

        const noOfvideosForPlaylist = Math.floor(randomUsersAllVideos.length*0.5)
        
        const videosForPlaylist = randomSample(randomUsersAllVideos,noOfvideosForPlaylist)// randomUsersAllVideos.slice(0,noOfvideosForPlaylist)
        
        const playlistName = faker.lorem.words(3)
        const playlistDescription = faker.lorem.sentence()

        const playListData = {
            name:playlistName,
            description:playlistDescription,
            videos:videosForPlaylist,
            owner:randomUser,
        }

        const playlist = await Playlist.create(playListData)

        playlists.push(playlist)
        
    }
    console.log(`seeded ${playlists.length} playlist successfully`);

    const likedVideosUsers = likes.filter((like)=> like && like.video && like.likedBy)

    const videolikedWatchedHistory = likedVideosUsers.reduce((accuObj,currele)=>{
        if(!accuObj[currele.likedBy]){
            accuObj[currele.likedBy] = likedVideosUsers
            .filter((like)=>like.likedBy == currele.likedBy)
            .map((like)=>like.video)
            
        }
        return accuObj;
    },{})
    
    for (const userId in videolikedWatchedHistory) {
        if (Object.prototype.hasOwnProperty.call(videolikedWatchedHistory, userId)) {
            await User.findByIdAndUpdate(userId,
                {
                    $set:{
                        watchHistory:videolikedWatchedHistory[userId]
                    }
                }
            )
        }
    }

    for (let index = 0; index < users.length; index++) {
        const randomNVideoHistories = getRandomInteger(Math.floor(videos.length*0.1),Math.floor(videos.length*0.2))
        const randomNvideos = randomSample(videos,randomNVideoHistories).map((video)=>video._id)
        
        const foundUser = await User.findById(users[index]._id)

        if(foundUser.watchHistory){
            await User.findByIdAndUpdate(users[index]._id,
                {
                    $addToSet: { 
                        watchHistory: { $each: randomNvideos } 
                    } 
                    
                }
            )

        }else{
            await User.findByIdAndUpdate(users[index]._id,
                {
                    $set:{
                        watchHistory:randomNvideos
                    }
                }
            )

        }
        
    }

    console.log("random video history added for users");

    const videoViews = await User.aggregate([
        {
          $unwind: {
            path: "$watchHistory",
          }
        },
        {
          $group: {
            _id: "$watchHistory",
            views: {
              $sum:1
              }
            }
        },
        {
          $sort: {
            views: -1
          }
        }
      ])
    
    const updatePromises = videoViews.map(({_id,views})=>{
                return Video.updateOne(
                {_id:_id},
                {
                    $set:{
                        views:views
                    }
                },{new:true}
            )
        }   
    )

    await Promise.all(updatePromises)
    
    console.log("Video views updated successfully.");

}

export { seedDatabase }