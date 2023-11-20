import express from "express"
import { addresource, createProject, deleteresource, deleteProject, getAllProjects, getProjectresource } from "../controllers/projectController.js"
import singleUpload from "../middlewares/multer.js"
import { authorizeAdmin, authorizeSubscribers, isAuthenticated } from "../middlewares/auth.js"

const router=express.Router()

router.route('/projects').get(getAllProjects)


router.route('/createproject').post(isAuthenticated,authorizeAdmin,singleUpload,createProject)


router.route('/project/:id')
.get(isAuthenticated,authorizeSubscribers,getProjectresource)
.post(isAuthenticated,authorizeAdmin,singleUpload,addresource)
.delete(isAuthenticated,authorizeAdmin,deleteProject)


router.route('/resource').delete(isAuthenticated,authorizeAdmin,deleteresource)


export default router