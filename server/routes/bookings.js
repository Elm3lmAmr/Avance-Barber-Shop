import express from 'express'
import Booking from '../models/Booking.js'
import { v4 as uuidv4 } from 'uuid'
const router = express.Router()

router.get('/slots', async (req,res)=>{
  const {date} = req.query
  if(!date) return res.status(400).json({ok:false,message:'Missing date'})
  const b = await Booking.find({date})
  res.json(b.map(x=>x.slot))
})

router.post('/book', async (req,res)=>{
  const {name,contact,date,slot} = req.body
  if(!name||!contact||!date||!slot) return res.status(400).json({ok:false,message:'Missing fields'})
  const phoneRegex = /^\+?\d{9,15}$/
  if(!phoneRegex.test(contact)) return res.status(400).json({ok:false,message:'Invalid phone format'})

  const slotTaken = await Booking.findOne({date,slot})
  if(slotTaken) return res.json({ok:false,message:'Slot already booked'})
  const alreadyToday = await Booking.findOne({date,contact})
  if(alreadyToday) return res.status(403).json({ok:false,message:'You already have a booking for this day.'})

  const newB = await Booking.create({id:uuidv4().slice(0,8),name,contact,date,slot})
  res.json({ok:true,bookingId:newB.id})
})

router.get('/admin/bookings', async (req,res)=>{
  const all = await Booking.find({}).sort({date:1,slot:1})
  res.json({ok:true,bookings:all})
})

router.post('/admin/cancel', async (req,res)=>{
  const {bookingId} = req.body
  if(!bookingId) return res.status(400).json({ok:false,message:'Missing booking ID'})
  const result = await Booking.deleteOne({id:bookingId})
  if(result.deletedCount===0) return res.json({ok:false,message:'Booking not found'})
  res.json({ok:true})
})

export default router
