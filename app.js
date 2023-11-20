import express from "express";
import {config} from "dotenv"
import ErrorMiddleware from './middlewares/Error.js'
import cookieParser from "cookie-parser";
import cors from 'cors'

config({
    path:"./config/config.env"
})
const app=express()


app.use(express.json())
app.use(
    express.urlencoded({
        extended:true,
    })
)

app.use(cookieParser())
app.use(
    cors({
        origin:process.env.FRONTEND_URL,
        credentials:true,
        methods:['GET','POST','PUT','DELETE'],
    })
)

import project from './routes/projectRoutes.js'
import user from './routes/userRoutes.js'
import payment from './routes/paymentRoutes.js'


app.use('/api/v1',project)
app.use('/api/v1',user)
app.use('/api/v1',payment)

export default app

app.use(ErrorMiddleware)