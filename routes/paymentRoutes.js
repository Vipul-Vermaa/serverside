import express from "express"
import { isAuthenticated } from "../middlewares/auth.js"
import { buySubscription, getRazorPayKey, paymentVerification } from "../controllers/paymentController.js"

const router=express.Router()

router.route('/subscribe').get(isAuthenticated,buySubscription)

router.route('/paymentverification').post(isAuthenticated,paymentVerification)

router.route('/razorpaykey').get(getRazorPayKey)

export default router