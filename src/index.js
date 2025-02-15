import dotenv from "dotenv"
dotenv.config({ path: './.env' });

import connectDB from "./db/index.js";
import {app} from './app.js'
import { seedDatabase } from './utils/seeding.js'

const PORT = process.env.PORT || 8000 

connectDB()
.then(async () => {
    try {
        // await seedDatabase();
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.log(`Error seeding database: ${error}`);
        }
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