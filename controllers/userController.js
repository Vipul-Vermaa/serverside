import  {catchAsyncError}  from "../middlewares/catchAsyncError.js";
import ErrorHandler from "../utils/errorHandler.js";
import {User} from '../models/User.js'
import { sendToken } from "../utils/sendtoken.js";
import {sendEmail} from '../utils/sendEmail.js'
import crypto from 'crypto'
import {Project} from '../models/Project.js'
import getDataUri from "../utils/dataUri.js";
import cloudinary from 'cloudinary'
import { Stats } from "../models/Stats.js";


export const register = catchAsyncError(async(req,res,next)=>{

    const {name,email,passowrd}=req.body;
    const file=req.file

    if(!name || !email || !passowrd ||!file) 
    return next(new ErrorHandler('Please Enter all fields',400))

    let user=await User.findOne({email})
    if (user) return next(new ErrorHandler('User Already Exist',400))

    
    const fileUri=getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content)

    user=await User.create({
        name,email,passowrd,
        avatar:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url
        },
    })

    sendToken(res,user,'Registered Successfully',201)
})



export const login = catchAsyncError(async(req,res,next)=>{

    const {email,passowrd}=req.body;
    const file=req.file

    if(!email || !passowrd) 
    return next(new ErrorHandler('Please Enter all fields',400))

    const user=await User.findOne({email}).select("+password")
     
    if (!user) return next(new ErrorHandler("Incorrect Email orPassword",401))

    const isMatch=await user.comparePassword(passowrd)
    if (!isMatch) return next(new ErrorHandler("Incorrect Email orPassword",401))


    sendToken(res,user,`Welcome ${user.name}`,200)
})


export const logout=catchAsyncError(async(req,res,next)=>{
    res.status(200).cookie("token",null,{
        expires:new Date(Date.now()),
        httpOnly:true,
        secure:true,
        sameSite:"none",
    }).json({
        success:true,
        message:'Logged Out',
    })
})


export const getMyProfile=catchAsyncError(async(req,res,next)=>{
    const user=await User.findById(req.user._id)
    res.status(200).json({
        success:true,
        user,
    })
})

export const changePassword=catchAsyncError(async(req,res,next)=>{
  
    const {oldPassword,newPassword}=req.body
    if(!oldPassword || !newPassword) 
    return next(new ErrorHandler('Please Enter all fields',400))
    const user=await User.findById(req.user._id).select("+password")
    const isMatch=await user.comparePassword(oldPassword)

    if(!isMatch) 
    return next(new ErrorHandler('Incorrect',400))

    user.password=newPassword
    await user.save()

    res.status(200).json({
        success:true,
        message:"Password changed successfully",     
    })
})


export const updateProfile=catchAsyncError(async(req,res,next)=>{
  
    const {name,email}=req.body
    const user=await User.findById(req.user._id)
    
    if(name) user.name=name
    if(email) user.email=email

    await user.save()
    res.status(200).json({
        success:true,
        message:"Profile Updated",     
    })
})


export const updateprofilepicture=catchAsyncError(async(req,res,next)=>{


    const file=req.file
    const user=await User.findById(req.user._id)
    const fileUri=getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content)

    await cloudinary.v2.uploader.destroy(user.avatar.public_id)

    user.avatar={
        public_id:mycloud.public_id,
        url:mycloud.secure_url,
    }
    await user.save()

    res.status(200).json({
        success:true,
        message:"Profile Picture Successfully Updated",
    })
})


export const forgetPassword=catchAsyncError(async(req,res,next)=>{
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user) return next(new ErrorHandler("Not Found",400))
    const resetToken=await user.getResetToken()

    await user.save()
    
    const url=`${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

    const message=`Click on the link to reset your password. ${url}.If you
    have not request,please ignore.`

    await sendEmail(user.email,"Reset Password",message)

    res.status(200).json({
        success:true,
        message:`Reset Token has been sent to ${user.email}`,
    })
})


export const resetPassword=catchAsyncError(async(req,res,next)=>{

    const {token}=req.params

    const resetPasswordToken=crypto
    .createHash('sha256')
    .update(token)
    .digest('hex') 

    const user=await User.findOne({
        resetPasswordToken,
        resetPasswordExpire:{
            $gt:Date.now(),
        },
    })

    if(!user) return next(new ErrorHandler("Token is invalid or expire",401))

    user.password=req.body.passowrd;
    user.resetPasswordToken=undefined;
    user.resetPasswordExpire=undefined;
    await user.save()


    res.status(200).json({
        success:true,
        message:"Password Changed Successfully",
    })
})

export const addToPlaylist=catchAsyncError(async(req,res,next)=>{

const user=await User.findById(req.user._id)
const project=await Project.findById(req.body.id)
if(!project) return next(new ErrorHandler('Inavlid Id',404))
const itemExist =user.playlist.find((item)=>{
    if(item.project.toString()===project._id.toString())return true
})
if(itemExist) return next(new ErrorHandler('Item Already Exist',409))
user.playlist.push({
    project:project._id,
    poster:project.poster.url,
})
await user.save()
res.status(200).json({
    success:true,
    message:"Added to playlist",
})
})




export const removeFromPlaylist=catchAsyncError(async(req,res,next)=>{
const user=await User.findById(req.user._id)
const project=await Project.findById(req.query.id)


if(!project) return next(new ErrorHandler('Inavlid Id',404))

const newPlaylist=user.playlist.filter((item)=>{
    if(item.project.toString()!==project._id.toString())return item
})

user.playlist=newPlaylist
await user.save()
res.status(200).json({
    success:true,
    message:"Removed from playlist",
})
})



export const getAllUsers=catchAsyncError(async(req,res,next)=>{


const users=await User.find({})


res.status(200).json({
    success:true,
    users,
})
})

export const updateUserRole=catchAsyncError(async(req,res,next)=>{


const user=await User.findById(req.params.id)
 if (!user) return next(new ErrorHandler('Not Found',404))

 if(user.role==="user")user.role="admin"
 else user.role="user"
 await user.save()

res.status(200).json({
    success:true,
    message:"Role Updated",
})
})



User.watch().on('change',async()=>{
    const stats=await Stats.find({})
    .sort({createdAt:"desc"})
    .limit(1)

    const subscription=await User.find
    ({'subscription.status':"active"})

    stats[0].users=await User.countDocuments()
    stats[0].subscription=subscription.length
    stats[0].createdAt=new Date(Date.now())

    await stats[0].save()
})