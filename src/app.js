import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

console.log("app.js")
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({
    limit: "16kb"
}))
app.use(express.static("public"))
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

// import router
import userRouter from "./routes/user.router.js";

app.use("/api/v0/users",userRouter);

export default app