
import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";  
import { DB_NAME } from "./constants.js";

dotenv.config({
    path: './.env'
})
import connectDB from "./db/index.js";


const app = express();

connectDB().then(()=>{
    app.on("error",(error)=>{
        console.log("Error: ",error);
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    }) 
}).catch((error)=>{
    console.log("Error: ",error);
    throw error
})

// (async()=>{
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         console.log(process.env.MONGODB_URL,DB_NAME)
//         app.on("error",(error)=>{
//             console.log("Error: ",error);
//             throw error
//         })
//         app.listen(process.env.PORT,()=>{
//             console.log(`Server is running on port ${process.env.PORT}`);
//         }) 
//     } catch (error) {
//         console.log("Error: ",error);
//         throw error
//     } 
// })()    

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
})      