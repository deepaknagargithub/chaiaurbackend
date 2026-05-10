import {asyncHandler} from '../utiles/asyncHandler.js'


const registerUser = asyncHandler(async (req,res)=>{
    res.status(200).json({
        message:"user registered successfully"
    })
})

export {registerUser}