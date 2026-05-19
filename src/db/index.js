import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";  



const connectDB = async()=>{

    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Connected to database: ${connectionInstance.connection.host}`)
    }catch (error) {
        console.log("DB Connection Error: ",error);
        throw error
    } 
}

export default connectDB;