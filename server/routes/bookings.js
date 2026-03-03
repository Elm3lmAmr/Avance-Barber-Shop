import express from 'express'
import Booking from '../models/Booking.js'
import { v4 as uuidv4 } from 'uuid'
import { verifyAdmin } from '../middleware/auth.js'

const router = express.Router()

// Public: get booked slots for a date
router.get('/slots', async (req, res) => {
  const { date } = req.query
  if (!date) return res.status(400).json({ ok: false, message: 'Missing date' })
  const b = await Booking.find({ date })
  res.json(b.map(x => x.slot))
})

// Public: create a booking
router.post('/book', async (req, res) => {
  const { name, contact, date, slot, service } = req.body
  if (!name || !contact || !date || !slot) return res.status(400).json({ ok: false, message: 'Missing fields' })

  // Reject past dates
  const today = new Date().toISOString().split('T')[0]
  if (date < today) return res.status(400).json({ ok: false, message: 'Cannot book a past date' })

  // Phone validation: strip spaces/dashes before checking
  const cleanPhone = contact.replace(/[\s\-().]/g, '')
  const phoneRegex = /^\+?\d{9,15}$/
  if (!phoneRegex.test(cleanPhone)) return res.status(400).json({ ok: false, message: 'Invalid phone format' })

  const slotTaken = await Booking.findOne({ date, slot })
  if (slotTaken) return res.json({ ok: false, message: 'Slot already booked' })
  const alreadyToday = await Booking.findOne({ date, contact: cleanPhone })
  if (alreadyToday) return res.status(403).json({ ok: false, message: 'You already have a booking for this day.' })

  const newB = await Booking.create({ id: uuidv4().slice(0, 8), name, contact: cleanPhone, date, slot, service: service || '' })
  res.json({ ok: true, bookingId: newB.id })
})

// Admin: list all bookings (protected)
router.get('/admin/bookings', verifyAdmin, async (req, res) => {
  const all = await Booking.find({}).sort({ date: 1, slot: 1 })
  res.json({ ok: true, bookings: all })
})

// Admin: cancel a booking (protected)
router.post('/admin/cancel', verifyAdmin, async (req, res) => {
  const { bookingId } = req.body
  if (!bookingId) return res.status(400).json({ ok: false, message: 'Missing booking ID' })
  const result = await Booking.deleteOne({ id: bookingId })
  if (result.deletedCount === 0) return res.json({ ok: false, message: 'Booking not found' })
  res.json({ ok: true })
})

export default router
