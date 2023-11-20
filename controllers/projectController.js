import { catchAsyncError } from '../middlewares/catchAsyncError.js'
import {Project} from '../models/Project.js'
import { Stats } from '../models/Stats.js'
import getDataUri from '../utils/dataUri.js'
import ErrorHandler from '../utils/errorHandler.js'
import cloudinary from 'cloudinary'

export const getAllProjects=catchAsyncError(async (req,res,next)=>{
    const projects=await Project.find().select('-resources')
    res.status(200).json({
        success:true,
        projects,
    })
})


export const createProject=catchAsyncError(async (req,res,next)=>{
    const {title,description,createdBy}=req.body
    if(!title || !description || !createdBy)
    return next(new ErrorHandler("Please add all fields",400))
    const file=req.file
    const fileUri =getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content)

    await Project.create({
        title,
        description,
        createdBy,
        poster:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        },
    })

    res.status(201).json({
        success:true,
        message:"Project Created",
    })
})


export const getProjectresource=catchAsyncError(async (req,res,next)=>{

    const project=await Project.findById(req.params.id)
    if(!project) return next(new ErrorHandler('Not found',404))
    project.views+=1
    await project.save()

    res.status(200).json({
        success:true,
        resources:project.resources,
    })
})


export const addresource=catchAsyncError(async (req,res,next)=>{
    const {id}=req.params
    const {title,description}=req.body
    const project=await Project.findById(id)
    if(!project) return next(new ErrorHandler('Not found',404))
    const file=req.file
    const fileUri =getDataUri(file)
    const mycloud=await cloudinary.v2.uploader.upload(fileUri.content
        ,{resource_type:"docFile",}
        )

    

    project.resources.push({
        title,
        description,
        docFile:{
            public_id:mycloud.public_id,
            url:mycloud.secure_url,
        },
    })

    project.numOfdocFile=project.resources.length
    await project.save()
    res.status(200).json({
        success:true,
        message:"Files Added"
    })
})



export const deleteProject=catchAsyncError(async (req,res,next)=>{

    const {id}=req.params
    const project=await Course.findById(id)
    if(!project)return next(new ErrorHandler("Not Found",400))

    await cloudinary.v2.uploader.destroy(project.poster.public_id)

    for (let i = 0; i < project.resources.length; i++) {
        const singleresource = project.resources[i];
        await cloudinary.v2.uploader.destroy(singleresource.docFile.public_id,{
            resource_type:"docFile",
        })
        
        await project.remove()
    }

    res.status(200).json({
        success:true,
        message:"Project Deleted",
    })
})


export const deleteresource=catchAsyncError(async (req,res,next)=>{

    const {projectId,resourceId}=req.query
    const project=await Project.findById(projectId)
    if(!project)return next(new ErrorHandler("Not Found",400))

    const resource=project.resources.find((item)=>{
        if (item._id.toString()===resourceId.toString()) return item
    })  
    
    await cloudinary.v2.uploader.destroy(resource.docFile.public_id)

    project.resources=project.resources.filter((item)=>{
        if (item._id.toString()!==resourceId.toString()) return item
    })

    project.numOfdocFile=project.resources.length
    await project.save()

    res.status(200).json({
        success:true,
        message:"Successfully Deleted",
    })
})


Project.watch().on('change',async()=>{
    const stats=await Stats.find({})
    .sort({createdAt:"desc"})
    .limit(1)

    const projects=await Project.find({})

    let totalViews=0

    for (let i = 0; i < projects.length; i++) {
        totalViews+=projects[i].views;
    }
    stats[0].views=totalViews
    stats[0].createdAt=new Date(Date.now())
    await stats[0].save()
})