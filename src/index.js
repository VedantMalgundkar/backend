import connectDB from "./db/index.js";

connectDB();



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