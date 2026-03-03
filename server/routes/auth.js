import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import bcrypt from 'bcrypt'

const router = express.Router()

router.post('/login', async (req,res)=>{
  const {email,password} = req.body
  if(!email||!password) return res.status(400).json({ok:false})
  const user = await User.findOne({email})
  if(!user) return res.status(401).json({ok:false,message:'Invalid'})
  const ok = await bcrypt.compare(password,user.passwordHash)
  if(!ok) return res.status(401).json({ok:false,message:'Invalid'})
  const token = jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET||'secret',{expiresIn:'6h'})
  res.json({ok:true,token})
})

export default router
