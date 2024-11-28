import connectDB from "./db/index.js";

import { app } from "./app.js"

const PORT = process.env.PORT || 8000 

connectDB()
.then(()=>{
    app.listen(PORT,()=>{
        console.log(`server is running on  http://localhost:${PORT}`);
    })
})
.catch((error)=>{
    console.log(`MongoDB connection failed : ${error}`);
});
















// import 'dotenv/config';
// import mongoose from "mongoose";
// import express from "express";
// import { DB_NAME } from './constants.js';

// const app = express()
// const MONGODB_URI = process.env.MONGODB_URI;

// (async ()=>{
//     try{
//         const connection = await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)
//         app.on("error",(error)=>{
//             console.log("Error : ",error);
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`server is running on  http://localhost:${process.env.PORT}`);
//         })

//     }catch(error){
//         console.error("Error: ",error);
//         throw error;
        
//     }
// })();