import  express  from "express";

import { authorizeAdmin, isAuthenticated } from "../middlewares/auth.js";
import { getDashboardStats } from "../controllers/otherController.js";

const router=express.Router()

router.route('/admin/stats').get(isAuthenticated,authorizeAdmin,getDashboardStats)

export default router