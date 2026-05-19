import {asyncHandler} from '../utiles/asyncHandler.js'
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utiles/cloudinary.js'
import { ApiResponse } from '../utiles/apiResponse.js'
import { ApiError } from '../utiles/apiError.js'
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return {accessToken,refreshToken};
        
    } catch (error) {
        throw new ApiError(500,"Error while generating access token and refresh token")
    }
}
const registerUser = asyncHandler(async (req,res)=>{
    const {username,email,password,fullname} = req.body


    // if(fullname === ""){
    //     throw new ApiError(400,"Fullname is required")
    // }

    if([username,email,password].some(field => field.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }  

    const userExists = await  User.findOne({
        $or: [{username},{email}]
    })

    if(userExists){
        throw new ApiError(400,"User already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover Image is required")
    }

    // upload file on cloudinary
    const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatarUrl){
        throw new ApiError(400,"Error while uploading avatar")
    }
    
    if(!coverImageUrl){
        throw new ApiError(400,"Error while uploading cover image")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password,
        fullname,
        avatar: avatarUrl.url,                
        coverImage: coverImageUrl.url    
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken "); 

    if(!createdUser){
        throw new ApiError(500,"Error while creating user")
    }

    // res.status(201).json({
    //     message:"User created successfully",
    //     createdUser
    // })  

    res.status(200).json(
        new ApiResponse(200,createdUser,"User created successfully")  
    )

    // res.status(200).json({                       
    //     message:"user registered successfully"
    // })
})
const loginUser = asyncHandler(async(req,res)=>{

    const {email,password} = req.body;

    if([email,password].some(field => field.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }   

    const user = await User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new ApiError(400,"User not found")
    }

    const isPasswordCorrect = user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid password");
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(-password-refreshToken);

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,loggedInUser,"User logged in successfully")  
    )
})
const logoutUser = asyncHandler(async(req,res)=>{

    try {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set:{
                    refreshToken:""
                }
            },
            {
                new:true
            }
        )  


        return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200,"User logged out successfully"))


    } catch (error) {
        throw new ApiError(500,"Error while logging out")
    }   
})
const refreshAccessToken = asyncHandler(async(req,res)=>{

    const {refreshToken} = req.cookies;

    if(!refreshToken){
        throw new ApiError(401,"Unauthorized")
    }  
    
    const decodedToken = jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);

    if(!user){
        throw new ApiError(401,"User not found")
    } 

    if(user.refreshToken !== refreshToken){
        throw new ApiError(401,"Unauthorized")
    }

    const  options = {
        httponly: true,
        secure: true,
    }

    await generateAccessTokenAndRefreshToken(user._id);
    const loggedInUser = await User.findById(user._id).select(-password-refreshToken);
 
    return res
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,loggedInUser,"User logged in successfully")  
    )
})
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    try {
        const {oldPassword,newPassword} = req.body;
        const user = await User.findById(req.user?._id);
        if(!user){
            throw new ApiError(404,"User not found")
        }
        const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

        if(!isPasswordCorrect){
            throw new ApiError(400,"Invalid password")
        }

        user.password = newPassword;
        await user.save();

        return res
        .status(200)
        .json(new ApiResponse(200,"Password changed successfully")) 

    } catch (error) {
        throw new ApiError(500,"Error while changing password")
    }
})
const getCurrentUser = asyncHandler(async (req,res)=>{
    try {
        return res
        .status(200)
        .json(new ApiResponse(200,req.user,"User fetched successfully"))
        
    } catch (error) {
        throw new ApiError(500,"Error while fetching current user")
    }
})
const updateAccountDetails = asyncHandler(async(req,res)=>{
    try {
        const {fullname,email} = req.body;

        if(!fullname || !email){
            throw new ApiError(400,"All fields are required")
        }

        const user = await User.findById(req.user?._id);
        if(!user){
            throw new ApiError(404,"User not found")
        }

        user.fullname = fullname;
        user.email = email;
        await user.save();

        return res
        .status(200)
        .json(new ApiResponse(200,"Account details updated successfully")) 

    } catch (error) {
        throw new ApiError(500,"Error while updating account details")
    }
})
const updateUserAvatar = asyncHandler(async(req,res)=>{
    try {
        const avatarLocalPath = req.files?.avatar?.[0]?.path;
        const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

        if(!avatarLocalPath){
            throw new ApiError(400,"Avatar is required")
        }

        if(!coverImageLocalPath){
            throw new ApiError(400,"Cover Image is required")
        }

        // upload file on cloudinary
        const avatarUrl = await uploadOnCloudinary(avatarLocalPath);
        const coverImageUrl = await uploadOnCloudinary(coverImageLocalPath);



    } catch (error) {
        throw new ApiError(500,"Error while updating avatar")
    }
})

const  getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params;
    if(!username){
        throw new ApiError(400,"Username is required")
    }
    const channelUser = await User.aggregate([
        {$match: {username: username}},
           { $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }},
            {$lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscribe",
                as:"subscribedTo"
            }},
            
            {$addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                avatar:1,
                coverImage:1,                           
                username:1,
                fullname:1,
                email:1,
            }}
    ])
    if(!channelUser){
        throw new ApiError(404,"Channel not found")
    }
    return res
    .status(200)
    .json(new ApiResponse(200,"Channel profile fetched successfully",channelUser))
})



export {registerUser,loginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,getUserChannelProfile}