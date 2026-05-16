import {asyncHandler} from '../utiles/asyncHandler.js'
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from '../utiles/cloudinary.js'
import { ApiResponse } from '../utiles/apiResponse.js'
import { ApiError } from '../utiles/apiError.js'


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

export {registerUser,loginUser,logoutUser}